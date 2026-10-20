# Giải thích phần xác thực và phân quyền

Tài liệu này mô tả luồng đang có trong dự án FastAPI và React.

## 1. Hai khái niệm

- **Xác thực (authentication):** xác định người gửi request là tài khoản nào. Dự án dùng email/mật khẩu để đăng nhập, sau đó dùng JWT để nhận diện người dùng ở các request tiếp theo.
- **Phân quyền (authorization):** xác định tài khoản đã đăng nhập được phép làm gì. Dự án dùng trường `role` (`USER` hoặc `ADMIN`) cho quyền quản trị; các dữ liệu cá nhân được giới hạn theo `user_id`.

## 2. Đăng ký và lưu mật khẩu

`POST /users/` nhận username, email, password. `UserService.create_user` kiểm tra email/username đã tồn tại chưa, băm mật khẩu bằng `hash_password` trong `app/security/password.py`, rồi lưu giá trị băm vào cột `password_hash`. Tài khoản đăng ký mới được gán `role="USER"`.

Mật khẩu gốc không được lưu trong bảng người dùng. Khi đăng nhập, `verify_password` so sánh mật khẩu người dùng nhập với giá trị băm đã lưu.

## 3. Đăng nhập và tạo JWT

Luồng đăng nhập:

1. Frontend gửi `POST /auth/login` với email và password.
2. `AuthService.login` tìm tài khoản theo email. Nếu không tìm thấy hoặc mật khẩu sai, API trả `401 Unauthorized`.
3. Nếu hợp lệ, `create_access_token` tạo JWT ký bằng `SECRET_KEY`, thuật toán `HS256`.
4. Payload hiện có `sub` là ID người dùng (dạng chuỗi) và `exp` là thời điểm hết hạn. Token hết hạn sau 60 phút.
5. API trả `access_token` và `token_type: "bearer"`. Frontend lưu token trong `localStorage`.

`SECRET_KEY` được đọc từ biến môi trường trong `.env`. Giá trị này phải được cấu hình và giữ bí mật; nếu không có hoặc bị lộ, việc tạo/kiểm tra token có thể lỗi hoặc mất an toàn.

## 4. Kiểm tra token ở backend

Các endpoint cần đăng nhập khai báo `Depends(get_current_user)` từ `app/dependencies/auth.py`. `HTTPBearer` yêu cầu header có dạng:

```http
Authorization: Bearer <access_token>
```

`get_current_user` giải mã và kiểm tra chữ ký, thuật toán và hạn dùng của token; đọc `sub`, tìm user tương ứng trong database, rồi trả về đối tượng `User`. Token thiếu/sai/hết hạn, `sub` không hợp lệ hoặc tài khoản không còn tồn tại đều dẫn đến `401 Unauthorized`.

Như vậy, mỗi request có xác thực đều kiểm tra user hiện tại trong database. Role được đọc từ bản ghi user, không lấy từ JWT.

## 5. Phân quyền USER và ADMIN

`require_admin` trước hết gọi `get_current_user`, sau đó kiểm tra `current_user.role == "ADMIN"`. Nếu người dùng đã đăng nhập nhưng không phải admin, backend trả `403 Forbidden`.

Các route trong `app/routers/admin.py` đều dùng `Depends(require_admin)`, ví dụ xem danh sách user, xem/sửa user và đặt lại mật khẩu. Vì kiểm tra được thực hiện ở backend, việc gọi trực tiếp API vẫn bị chặn nếu không có quyền admin.

Role mặc định của tài khoản mới là `USER`. Muốn có tài khoản admin, trường `role` của tài khoản phải được đặt thành `ADMIN` trong database hoặc qua một quy trình quản trị đáng tin cậy; API đăng ký hiện không cho client chọn role.

## 6. Phân quyền dữ liệu cá nhân

Các endpoint giao dịch, danh mục, ví, ngân sách, kế hoạch chi tiêu và mục tiêu tiết kiệm cũng yêu cầu `get_current_user`. Router truyền `current_user.id` xuống service/repository để truy vấn hoặc thay đổi dữ liệu của đúng người dùng. Ví dụ repository giao dịch lọc theo cả ID bản ghi và `Transaction.user_id`.

Đây là lớp phân quyền theo chủ sở hữu dữ liệu: user đăng nhập không mặc nhiên được thao tác dữ liệu của user khác. Việc giới hạn này cần được duy trì trong service/repository cho từng loại dữ liệu.

Một số route user:

- `POST /users/`: đăng ký, không cần đăng nhập.
- `GET /users/me`, `PATCH /users/me`, `DELETE /users/me`: chỉ thao tác tài khoản đang đăng nhập.
- `POST /auth/login`: đăng nhập, không cần token.

## 7. Frontend gửi token và bảo vệ trang

`frontend/src/services/api.js` có Axios interceptor tự gắn token từ `localStorage` vào header `Authorization` cho các request. Nếu nhận `401`, interceptor xóa token và chuyển về trang đăng nhập.

`AuthContext` gọi `GET /users/me` khi ứng dụng khởi động để tải user hiện tại. `ProtectedRoute` chuyển người chưa có token sang trang đăng nhập; với trang admin, nó còn kiểm tra `user.role === "ADMIN"`.

> Kiểm tra ở frontend chỉ nhằm điều hướng giao diện. Quyền truy cập dữ liệu phải luôn được kiểm tra ở backend; dự án hiện có `require_admin` cho API admin và `get_current_user` cho các API cần đăng nhập.

## 8. Một vài chi tiết cần biết trong mã hiện tại

- `TokenRespone` trong `app/schemas/auth.py` chỉ khai báo `access_token` và `token_type`, trong khi `AuthService.login` cũng trả trường `user`. Vì route login dùng `response_model=TokenRespone`, FastAPI sẽ lọc phản hồi theo schema và trường `user` có thể không được gửi về client. Frontend hiện lấy thông tin user qua `GET /users/me` nên luồng đăng nhập vẫn có thể hoạt động.
- Frontend lưu JWT trong `localStorage`. Điều này thuận tiện cho ứng dụng hiện tại, nhưng JavaScript có thể đọc token; cần bảo vệ ứng dụng trước lỗ hổng XSS.
- `app/security/jwt.py` và `app/dependencies/auth.py` đều khai báo HTTP Bearer scheme; dependency đang được sử dụng trực tiếp là `bearer_scheme` ở `app/dependencies/auth.py`.

## Tóm tắt luồng

```text
Đăng ký -> băm password -> lưu password_hash, role USER
Đăng nhập -> kiểm tra password -> cấp JWT có sub và exp
Request bảo vệ -> gửi Bearer token -> backend kiểm tra token -> tải user từ DB
  -> API thông thường: giới hạn dữ liệu theo user_id
  -> API admin: kiểm tra thêm role ADMIN
```

## Các file chính

- `app/security/password.py`: băm và xác minh mật khẩu.
- `app/security/jwt.py`: cấu hình và tạo JWT.
- `app/dependencies/auth.py`: xác thực token, tải user và kiểm tra admin.
- `app/services/auth_service.py`, `app/routers/auth.py`: xử lý đăng nhập.
- `app/services/user_service.py`, `app/routers/users.py`: đăng ký và API tài khoản hiện tại.
- `app/routers/admin.py`: các API chỉ dành cho admin.
- `frontend/src/services/api.js`, `frontend/src/context/AuthContext.jsx`, `frontend/src/components/ProtectedRoute.jsx`: lưu/gửi token và bảo vệ giao diện.

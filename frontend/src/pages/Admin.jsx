import React, { useState, useEffect } from "react";
import { ShieldAlert, Users, KeyRound, Search, RotateCw, X, CheckCircle, ShieldCheck } from "lucide-react";
import { getAdminUsers, resetUserPassword } from "../services/api";

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal Reset Password
  const [resetModalUser, setResetModalUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getAdminUsers();
      setUsers(data || []);
    } catch (err) {
      console.error("Lỗi khi tải danh sách người dùng:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      alert("Mật khẩu mới phải có ít nhất 6 ký tự!");
      return;
    }

    setResetting(true);
    try {
      await resetUserPassword(resetModalUser.id, newPassword);
      setSuccessMsg(`Đã đặt lại mật khẩu thành công cho ${resetModalUser.username}!`);
      setTimeout(() => {
        setResetModalUser(null);
        setNewPassword("");
        setSuccessMsg("");
      }, 1500);
    } catch (err) {
      alert(err.response?.data?.detail || "Không thể đặt lại mật khẩu!");
    } finally {
      setResetting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return u.username?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term);
  });

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc]">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200/80 px-8 py-5 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <span>Bảng Quản Trị Hệ Thống</span>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[10px] font-bold uppercase tracking-wider border border-rose-200">
              Admin Only
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Quản lý danh sách thành viên và phân quyền</p>
        </div>

        <button
          onClick={loadUsers}
          className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
          title="Làm mới"
        >
          <RotateCw className={`w-4 h-4 ${loading ? "animate-spin text-purple-600" : ""}`} />
        </button>
      </header>

      {/* BODY */}
      <div className="p-6 lg:p-8 space-y-6">
        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">Tổng số người dùng</p>
              <h3 className="text-3xl font-black text-slate-800 mt-1">{users.length}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">Quản trị viên (ADMIN)</p>
              <h3 className="text-3xl font-black text-purple-600 mt-1">
                {users.filter((u) => u.role === "ADMIN").length}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* SEARCH */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-sm flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo username hoặc email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
        </div>

        {/* USERS TABLE */}
        <div className="bg-white rounded-3xl border border-slate-200/70 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[11px] tracking-wider">
                <tr>
                  <th className="py-4 px-6">ID</th>
                  <th className="py-4 px-6">Người dùng</th>
                  <th className="py-4 px-6">Email</th>
                  <th className="py-4 px-6">Vai trò</th>
                  <th className="py-4 px-6 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-4 px-6 font-bold text-slate-400">#{u.id}</td>
                      <td className="py-4 px-6 font-bold text-slate-800">{u.username}</td>
                      <td className="py-4 px-6 text-slate-500">{u.email}</td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-3 py-1 rounded-xl text-[10px] font-bold ${
                            u.role === "ADMIN"
                              ? "bg-purple-100 text-purple-700 border border-purple-200"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {u.role || "USER"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => {
                            setResetModalUser(u);
                            setNewPassword("");
                            setSuccessMsg("");
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 transition"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Đổi mật khẩu</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-10 text-center text-slate-400">
                      {loading ? "Đang tải dữ liệu..." : "Không tìm thấy người dùng phù hợp"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL RESET PASSWORD */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setResetModalUser(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-black text-slate-800">Đặt Lại Mật Khẩu</h2>
            <p className="text-xs text-slate-400 mb-5">Cho người dùng: <b>{resetModalUser.username}</b></p>

            {successMsg && (
              <div className="mb-4 p-3 rounded-2xl bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Mật khẩu mới</label>
                <input
                  type="password"
                  required
                  placeholder="Tối thiểu 6 ký tự"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold"
                />
              </div>

              <button
                type="submit"
                disabled={resetting}
                className="w-full py-3 bg-[#7a4bf6] hover:bg-[#6838eb] text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 mt-2"
              >
                {resetting ? "Đang xử lý..." : "Xác nhận đặt lại"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


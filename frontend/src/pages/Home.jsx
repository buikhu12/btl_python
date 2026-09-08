function Home() {
    const token = localStorage.getItem("access_token");

    const logout = () => {
        localStorage.removeItem("access_token");
        window.location.href = "/login";
    };

    return (
        <div>
            <h1>Finance Manager</h1>

            <p>
                Bạn đã đăng nhập thành công!
            </p>

            <p>
                Token: {token ? "Đã đăng nhập" : "Chưa đăng nhập"}
            </p>

            <button onClick={logout}>
                Đăng xuất
            </button>
        </div>
    );
}

export default Home;
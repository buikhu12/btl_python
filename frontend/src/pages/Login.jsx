import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/authService";

function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        try {
            const data = await login(email, password);

            // Lưu JWT
            localStorage.setItem("access_token", data.access_token);

            // Chuyển về trang chủ
            navigate("/");
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <div style={styles.container}>
            <form onSubmit={handleSubmit} style={styles.form}>
                <h1>Đăng nhập</h1>

                {error && (
                    <p style={styles.error}>
                        {error}
                    </p>
                )}

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={styles.input}
                    required
                />

                <input
                    type="password"
                    placeholder="Mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={styles.input}
                    required
                />

                <button type="submit" style={styles.button}>
                    Đăng nhập
                </button>
            </form>
        </div>
    );
}

const styles = {
    container: {
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f5f5f5",
    },

    form: {
        width: "350px",
        padding: "30px",
        backgroundColor: "white",
        borderRadius: "10px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
    },

    input: {
        width: "100%",
        padding: "12px",
        marginTop: "15px",
        boxSizing: "border-box",
    },

    button: {
        width: "100%",
        padding: "12px",
        marginTop: "20px",
        cursor: "pointer",
    },

    error: {
        color: "red",
    },
};

export default Login;
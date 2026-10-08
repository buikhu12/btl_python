import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  IdCard,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Save,
  Loader2,
  ArrowLeft
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { updateMe, deleteMe } from "../services/api";

export default function Profile() {
  const { user, refreshUser, logoutUser } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setUpdating(true);

    try {
      await updateMe(username, email, password);
      await refreshUser();
      setPassword("");
      setMessage("Cập nhật thông tin thành công!");
    } catch (err) {
      setError(err.response?.data?.detail || "Cập nhật thất bại. Vui lòng thử lại!");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Bạn có chắc muốn xóa tài khoản vĩnh viễn? Toàn bộ giao dịch và mục tiêu tích lũy sẽ bị xóa và không thể khôi phục."
    );

    if (!confirmDelete) return;

    setDeleting(true);
    try {
      await deleteMe();
      logoutUser();
    } catch (err) {
      setError(err.response?.data?.detail || "Xóa tài khoản không thành công.");
      setDeleting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc]">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200/80 px-8 py-5 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Hồ Sơ & Cài Đặt Tài Khoản</h1>
          <p className="text-xs text-slate-400 mt-0.5">Quản lý thông tin bảo mật và hồ sơ cá nhân</p>
        </div>
      </header>

      {/* BODY */}
      <div className="p-6 lg:p-8 max-w-2xl mx-auto w-full space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200/70 shadow-sm p-6 sm:p-8 space-y-6">
          {/* USER INFO HEADER */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-purple-500/20">
                {username?.charAt(0).toUpperCase() || "U"}
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-800">{username}</h2>
                <p className="text-xs text-slate-400">{email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold">
                <IdCard className="w-3.5 h-3.5 text-slate-400" />
                ID: {user?.id}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                {user?.role || "USER"}
              </span>
            </div>
          </div>

          {/* MESSAGES */}
          {message && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-700">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Tên tài khoản
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/40 focus:border-purple-500 font-medium transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Địa chỉ Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/40 focus:border-purple-500 font-medium transition"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Mật khẩu mới
                </label>
                <span className="text-[11px] text-slate-400">Để trống nếu không muốn đổi</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/40 focus:border-purple-500 font-medium transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={updating}
                className="w-full py-3 px-4 bg-[#7a4bf6] hover:bg-[#6838eb] active:bg-purple-800 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-500/20 transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {updating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang cập nhật...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Lưu thay đổi</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* DANGER ZONE */}
          <div className="pt-6 border-t border-slate-100">
            <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-bold text-rose-800">Xóa tài khoản vĩnh viễn</h3>
                <p className="text-[11px] text-rose-600/80 mt-0.5">
                  Xóa tài khoản cùng toàn bộ giao dịch và mục tiêu tài chính của bạn.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-60 shrink-0"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Xóa tài khoản</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
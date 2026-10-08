import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  ArrowLeftRight,
  FolderKanban,
  PiggyBank,
  Sparkles,
  UserCheck,
  ShieldAlert,
  LogOut,
  Plus,
  X,
  CreditCard,
  Wallet,
  PieChart,
  Menu
} from "lucide-react";
import { getCategories, createTransaction } from "../services/api";

export default function Layout({ children }) {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(false);

  // Form states cho Modal thêm nhanh giao dịch
  const [txForm, setTxForm] = useState({
    amount: "",
    type: "expense",
    category_id: "",
    note: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (showQuickModal) {
      loadCategories();
    }
  }, [showQuickModal]);

  const loadCategories = async () => {
    try {
      setLoadingCats(true);
      const data = await getCategories();
      setCategories(data);
      if (data.length > 0 && !txForm.category_id) {
        setTxForm((prev) => ({ ...prev, category_id: data[0].id }));
      }
    } catch (err) {
      console.warn("Could not load categories:", err);
    } finally {
      setLoadingCats(false);
    }
  };

  const handleQuickSubmit = async (e) => {
    e.preventDefault();
    if (!txForm.amount || !txForm.category_id) {
      alert("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    try {
      setSubmitting(true);
      await createTransaction({
        amount: parseFloat(txForm.amount),
        type: txForm.type,
        category_id: parseInt(txForm.category_id),
        note: txForm.note || "",
      });

      setShowQuickModal(false);
      setTxForm({
        amount: "",
        type: "expense",
        category_id: categories[0]?.id || "",
        note: "",
      });
      // Bắn event để các trang đang hiển thị reload dữ liệu
      window.dispatchEvent(new Event("transaction-updated"));
    } catch (err) {
      alert(err.response?.data?.detail || "Không thể tạo giao dịch!");
    } finally {
      setSubmitting(false);
    }
  };

  const navItems = [
    { name: "Tổng quan", path: "/", icon: LayoutDashboard },
    { name: "Sổ giao dịch", path: "/transactions", icon: ArrowLeftRight },
    { name: "Ví tiền của tôi", path: "/wallets", icon: Wallet },
    { name: "Hạn mức ngân sách", path: "/budgets", icon: PieChart },
    { name: "Danh mục", path: "/categories", icon: FolderKanban },
    { name: "Mục tiêu tiết kiệm", path: "/savings", icon: PiggyBank },
    { name: "AI & Báo cáo", path: "/reports", icon: Sparkles },
    { name: "Tài khoản", path: "/profile", icon: UserCheck },
  ];

  if (user?.role === "ADMIN") {
    navItems.push({ name: "Quản trị viên", path: "/admin", icon: ShieldAlert });
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800 overflow-hidden font-sans">
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden lg:flex w-64 bg-[#7a4bf6] text-white flex-col justify-between shrink-0 shadow-2xl z-20">
        <div>
          {/* Brand header */}
          <div className="px-6 py-6 flex items-center gap-3 border-b border-purple-500/30">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner">
              🍋
            </div>
            <div>
              <h2 className="font-extrabold text-base tracking-wide uppercase text-white">Lovely Money</h2>
              <p className="text-[11px] text-purple-200">Quản Lý Tài Chính</p>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="p-4">
            <button
              onClick={() => setShowQuickModal(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white text-purple-700 font-bold text-xs shadow-lg hover:bg-purple-50 transition active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Ghi chép giao dịch</span>
            </button>
          </div>

          {/* Navigation links */}
          <nav className="px-3 space-y-1.5 mt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.path);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-semibold transition ${
                    isActive
                      ? "bg-white/20 text-white shadow-sm font-bold backdrop-blur-md"
                      : "text-purple-100 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar user & logout */}
        <div className="p-4 border-t border-purple-500/30 bg-purple-900/20">
          <div className="flex items-center justify-between mb-3 px-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-purple-300 text-purple-900 font-bold flex items-center justify-center text-xs shrink-0">
                {user?.username?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{user?.username || "Người dùng"}</p>
                <p className="text-[10px] text-purple-200 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
          <button
            onClick={logoutUser}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-purple-200 hover:text-white hover:bg-purple-800/60 text-xs font-medium transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER & DRAWER */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#7a4bf6] text-white flex items-center justify-between px-4 z-30 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-base">🍋</div>
          <span className="font-bold text-sm tracking-wide">Lovely Money</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQuickModal(true)}
            className="p-2 bg-white text-purple-700 rounded-xl text-xs font-bold"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-white hover:bg-white/10 rounded-xl"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* MOBILE MENU BACKDROP & DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="w-64 h-full bg-[#7a4bf6] text-white flex flex-col justify-between p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-purple-500/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-lg">🍋</div>
                  <span className="font-bold text-sm">Lovely Money</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X className="w-5 h-5 text-white/80" />
                </button>
              </div>

              <nav className="space-y-1 mt-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-purple-100 hover:bg-white/10"
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-purple-500/30">
              <button
                onClick={logoutUser}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-purple-200 hover:bg-purple-800 text-xs font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-y-auto lg:pt-0 pt-16">
        {children}
      </div>

      {/* MODAL THÊM GIAO DỊCH NHANH */}
      {showQuickModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowQuickModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-black text-slate-800">Ghi Chép Giao Dịch</h2>
            <p className="text-xs text-slate-400 mb-5">Thêm thu nhập hoặc khoản chi tiêu mới</p>

            <form onSubmit={handleQuickSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Loại giao dịch</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTxForm({ ...txForm, type: "expense" })}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      txForm.type === "expense"
                        ? "bg-rose-50 border-rose-500 text-rose-600"
                        : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    Chi tiêu
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxForm({ ...txForm, type: "income" })}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      txForm.type === "income"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-600"
                        : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    Thu nhập
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Số tiền (VND)</label>
                <input
                  type="number"
                  required
                  placeholder="Ví dụ: 50000"
                  value={txForm.amount}
                  onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Danh mục</label>
                {loadingCats ? (
                  <div className="text-xs text-slate-400 py-2">Đang tải danh mục...</div>
                ) : (
                  <select
                    value={txForm.category_id}
                    onChange={(e) => setTxForm({ ...txForm, category_id: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    {categories
                      .filter((c) => c.type === txForm.type)
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    {categories.filter((c) => c.type === txForm.type).length === 0 && (
                      <option value="" disabled>
                        Chưa có danh mục loại này
                      </option>
                    )}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Ghi chú</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Ăn trưa bún bò"
                  value={txForm.note}
                  onChange={(e) => setTxForm({ ...txForm, note: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-[#7a4bf6] hover:bg-[#6838eb] text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 mt-2"
              >
                {submitting ? "Đang lưu..." : "Lưu giao dịch"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


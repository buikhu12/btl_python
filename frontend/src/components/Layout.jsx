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
import { getCategories, createTransaction, createCategory, seedDefaultCategories } from "../services/api";

export default function Layout({ children }) {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(false);

  // Quick category creation inside modal
  const [showQuickAddCat, setShowQuickAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [catActionLoading, setCatActionLoading] = useState(false);

  // Form states cho Modal thêm nhanh giao dịch
  const [txForm, setTxForm] = useState({
    amount: "",
    type: "expense",
    category_id: "",
    note: "",
    occurred_at: new Date().toISOString().slice(0, 16),
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (showQuickModal) {
      loadCategories();
    }
  }, [showQuickModal]);

  useEffect(() => {
    const handleCategoriesUpdated = async () => {
      try {
        const data = await getCategories();
        setCategories(data || []);
      } catch (err) {
        console.warn("Could not reload categories:", err);
      }
    };
    window.addEventListener("categories-updated", handleCategoriesUpdated);
    return () => window.removeEventListener("categories-updated", handleCategoriesUpdated);
  }, []);

  const loadCategories = async () => {
    try {
      setLoadingCats(true);
      const data = await getCategories();
      setCategories(data || []);
      if (data && data.length > 0 && !txForm.category_id) {
        const matched = data.find((c) => c.type === txForm.type);
        setTxForm((prev) => ({ ...prev, category_id: matched ? matched.id : "" }));
      }
    } catch (err) {
      console.warn("Could not load categories:", err);
    } finally {
      setLoadingCats(false);
    }
  };

  const handleTypeChange = (newType) => {
    const matched = categories.find((c) => c.type === newType);
    setTxForm((prev) => ({
      ...prev,
      type: newType,
      category_id: matched ? matched.id : "",
    }));
  };

  const handleQuickCreateCategory = async (e) => {
    if (e) e.preventDefault();
    if (!newCatName.trim()) {
      alert("Vui lòng nhập tên danh mục!");
      return;
    }
    try {
      setCatActionLoading(true);
      const created = await createCategory({
        name: newCatName.trim(),
        type: txForm.type,
      });
      const updatedCats = [...categories, created];
      setCategories(updatedCats);
      setTxForm((prev) => ({ ...prev, category_id: created.id }));
      setNewCatName("");
      setShowQuickAddCat(false);
      window.dispatchEvent(new Event("categories-updated"));
    } catch (err) {
      alert(err.response?.data?.detail || "Không thể tạo danh mục mới!");
    } finally {
      setCatActionLoading(false);
    }
  };

  const handleSeedCategories = async () => {
    try {
      setCatActionLoading(true);
      const seeded = await seedDefaultCategories();
      setCategories(seeded || []);
      const matched = (seeded || []).find((c) => c.type === txForm.type);
      if (matched) {
        setTxForm((prev) => ({ ...prev, category_id: matched.id }));
      }
    } catch (err) {
      alert("Không thể khởi tạo danh mục mẫu!");
    } finally {
      setCatActionLoading(false);
    }
  };

  const handleQuickSubmit = async (e) => {
    e.preventDefault();
    if (!txForm.amount) {
      alert("Vui lòng nhập số tiền!");
      return;
    }
    if (!txForm.category_id) {
      alert("Vui lòng chọn danh mục phù hợp trước khi gửi!");
      return;
    }

    try {
      setSubmitting(true);
      await createTransaction({
        amount: parseFloat(txForm.amount),
        type: txForm.type,
        category_id: parseInt(txForm.category_id),
        note: txForm.note || "",
        occurred_at: txForm.occurred_at
          ? new Date(txForm.occurred_at).toISOString()
          : new Date().toISOString(),
      });

      setShowQuickModal(false);
      const defaultMatched = categories.find((c) => c.type === "expense");
      setTxForm({
        amount: "",
        type: "expense",
        category_id: defaultMatched ? defaultMatched.id : "",
        note: "",
        occurred_at: new Date().toISOString().slice(0, 16),
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
                  : item.path === "/reports"
                  ? location.pathname.startsWith("/reports") || location.pathname.startsWith("/ai")
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
                    onClick={() => handleTypeChange("expense")}
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
                    onClick={() => handleTypeChange("income")}
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
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-600">Danh mục</label>
                  <button
                    type="button"
                    onClick={() => setShowQuickAddCat(!showQuickAddCat)}
                    className="text-[11px] font-bold text-purple-600 hover:text-purple-700 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{showQuickAddCat ? "Đóng tạo nhanh" : "+ Thêm nhanh danh mục"}</span>
                  </button>
                </div>

                {/* Khung tạo nhanh danh mục ngay trong modal */}
                {showQuickAddCat && (
                  <div className="mb-2.5 p-3 bg-purple-50/80 border border-purple-200/80 rounded-xl space-y-2">
                    <p className="text-[11px] text-purple-700 font-semibold">
                      Tạo danh mục mới cho khoản <span className="font-bold underline">{txForm.type === "expense" ? "Chi tiêu" : "Thu nhập"}</span>:
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="VD: Cà phê, Tiền điện, Thưởng..."
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white border border-purple-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium"
                      />
                      <button
                        type="button"
                        disabled={catActionLoading || !newCatName.trim()}
                        onClick={handleQuickCreateCategory}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition whitespace-nowrap"
                      >
                        {catActionLoading ? "Đang tạo..." : "Lưu & Chọn"}
                      </button>
                    </div>
                  </div>
                )}

                {loadingCats ? (
                  <div className="text-xs text-slate-400 py-2">Đang tải danh mục...</div>
                ) : (
                  <select
                    value={txForm.category_id}
                    onChange={(e) => setTxForm({ ...txForm, category_id: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium"
                  >
                    {!txForm.category_id && (
                      <option value="">-- Chọn danh mục --</option>
                    )}
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

                {categories.filter((c) => c.type === txForm.type).length === 0 && !loadingCats && (
                  <div className="mt-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-2">
                    <span className="text-[11px] text-amber-700 font-medium">
                      Chưa có danh mục {txForm.type === "expense" ? "chi tiêu" : "thu nhập"}.
                    </span>
                    <button
                      type="button"
                      disabled={catActionLoading}
                      onClick={handleSeedCategories}
                      className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-[11px] font-bold rounded-lg transition whitespace-nowrap shadow-sm"
                    >
                      {catActionLoading ? "Đang nạp..." : "Tạo danh mục mẫu"}
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Thời gian</label>
                <input
                  type="datetime-local"
                  required
                  value={txForm.occurred_at}
                  onChange={(e) => setTxForm({ ...txForm, occurred_at: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
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


import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  FolderKanban,
  BadgePercent,
  TrendingUp,
  Settings,
  Search,
  Bell,
  Plus,
  X,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  RotateCw,
  LogOut,
  Layers
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

const API_BASE = "http://127.0.0.1:8000";
const PIE_COLORS = ["#ff5252", "#2979ff", "#b388ff", "#00e676", "#ff9100", "#ffd600"];

export default function LovelyDashboard() {
  const navigate = useNavigate();

  // Dữ liệu Dashboard
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    total_income: 0,
    total_expense: 0,
    balance: 0,
    transaction_count: 0
  });
  const [categoryExpenses, setCategoryExpenses] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);

  // State điều khiển Modal Popup
  const [showTxModal, setShowTxModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Form states cho Transaction mới
  const [txForm, setTxForm] = useState({
    amount: "",
    type: "expense",
    category_id: "",
    note: ""
  });

  // Form states cho Category mới
  const [catForm, setCatForm] = useState({
    name: "",
    type: "expense"
  });

  const [formLoading, setFormLoading] = useState(false);

  const formatVND = (val) => {
    return new Intl.NumberFormat("vi-VN").format(Number(val) || 0) + " VND";
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/login");
      return null;
    }
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  // 1. Tải danh mục có sẵn để chọn trong form thêm transaction
  const fetchCategories = async () => {
    const headers = getAuthHeaders();
    if (!headers) return;
    try {
      const res = await axios.get(`${API_BASE}/categories`, headers);
      setCategoriesList(res.data);
      if (res.data.length > 0 && !txForm.category_id) {
        setTxForm((prev) => ({ ...prev, category_id: res.data[0].id }));
      }
    } catch (err) {
      console.warn("Chưa tải được danh mục hoặc API categories chưa sẵn sàng:", err);
    }
  };

  // 2. Tải toàn bộ dữ liệu thống kê Dashboard
  const fetchDashboardData = useCallback(async () => {
    const headers = getAuthHeaders();
    if (!headers) return;

    setLoading(true);
    try {
      const [sumRes, catExpRes, monthRes, recRes] = await Promise.all([
        axios.get(`${API_BASE}/dashboard/summary`, headers),
        axios.get(`${API_BASE}/dashboard/category-expenses`, headers),
        axios.get(`${API_BASE}/dashboard/monthly`, headers),
        axios.get(`${API_BASE}/dashboard/recent-transactions`, headers)
      ]);

      setSummary(sumRes.data);
      setCategoryExpenses(
        catExpRes.data.map((item) => ({
          name: item.category_name,
          value: Number(item.total_amount)
        }))
      );

      const monthsMap = {};
      monthRes.data.forEach((item) => {
        const key = `Tháng ${item.month}`;
        if (!monthsMap[key]) {
          monthsMap[key] = { label: key, income: 0, expense: 0 };
        }
        if (item.type === "income") monthsMap[key].income = Number(item.total_amount);
        if (item.type === "expense") monthsMap[key].expense = Number(item.total_amount);
      });
      setMonthlyData(Object.values(monthsMap));
      setRecentTransactions(recRes.data);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchDashboardData();
    fetchCategories();
  }, [fetchDashboardData]);

  // 3. Xử lý thêm Giao dịch mới
  const handleAddTransaction = async (e) => {
    e.preventDefault();
    const headers = getAuthHeaders();
    if (!headers) return;

    setFormLoading(true);
    try {
      await axios.post(
        `${API_BASE}/transactions`,
        {
          amount: parseFloat(txForm.amount),
          type: txForm.type,
          category_id: parseInt(txForm.category_id),
          note: txForm.note
        },
        headers
      );

      setShowTxModal(false);
      setTxForm({ amount: "", type: "expense", category_id: categoriesList[0]?.id || "", note: "" });
      fetchDashboardData(); // Cập nhật lại số liệu ngay lập tức
    } catch (err) {
      alert(err.response?.data?.detail || "Lỗi khi tạo giao dịch!");
    } finally {
      setFormLoading(false);
    }
  };

  // 4. Xử lý thêm Danh mục mới
  const handleAddCategory = async (e) => {
    e.preventDefault();
    const headers = getAuthHeaders();
    if (!headers) return;

    setFormLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE}/categories`,
        {
          name: catForm.name,
          type: catForm.type
        },
        headers
      );

      setShowCategoryModal(false);
      setCatForm({ name: "", type: "expense" });
      fetchCategories();
      alert("Thêm danh mục thành công!");
    } catch (err) {
      alert(err.response?.data?.detail || "Lỗi khi tạo danh mục!");
    } finally {
      setFormLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-[#f7f8fd] overflow-hidden font-sans">
      
      {/* SIDEBAR TÍM (LOVELY MONEY) */}
      <aside className="w-64 bg-[#7a4bf6] text-white flex flex-col justify-between shrink-0 shadow-xl">
        <div>
          {/* Logo & Thương hiệu */}
          <div className="px-6 py-8 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl font-black">
              🍋
            </div>
            <div>
              <h2 className="font-extrabold text-base tracking-wider uppercase">Lovely Money</h2>
              <p className="text-[11px] text-purple-200">Finance Manager</p>
            </div>
          </div>

          {/* Danh sách Menu */}
          <nav className="px-4 space-y-1.5">
            <button className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-white/20 font-semibold text-sm backdrop-blur-sm transition">
              <LayoutDashboard className="w-4 h-4" />
              <span>Tổng quan</span>
            </button>
            <button
              onClick={() => setShowTxModal(true)}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-purple-100 hover:bg-white/10 font-medium text-sm transition"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Giao dịch</span>
            </button>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-purple-100 hover:bg-white/10 font-medium text-sm transition"
            >
              <FolderKanban className="w-4 h-4" />
              <span>Danh mục</span>
            </button>
            <button
              onClick={() => navigate("/profile")}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-purple-100 hover:bg-white/10 font-medium text-sm transition"
            >
              <Settings className="w-4 h-4" />
              <span>Tài khoản & Cài đặt</span>
            </button>
          </nav>
        </div>

        {/* Nút Đăng xuất ở chân Sidebar */}
        <div className="p-4 border-t border-purple-500/40">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-purple-200 hover:text-white hover:bg-purple-700/60 text-xs font-semibold transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* KHÔNG GIAN NỘI DUNG CHÍNH */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        
        {/* HEADER TRÊN CÙNG */}
        <header className="h-20 bg-white border-b border-slate-100 px-8 flex items-center justify-between shrink-0 sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">Tổng quan tài chính</h1>
            <p className="text-xs text-slate-400 mt-0.5">Báo cáo tình hình thu chi cá nhân</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Thanh Search giả lập */}
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
              />
            </div>

            {/* Nút Thêm Danh Mục */}
            <button
              onClick={() => setShowCategoryModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 transition"
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>+ Danh mục</span>
            </button>

            {/* Nút Thêm Giao Dịch */}
            <button
              onClick={() => setShowTxModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#7a4bf6] hover:bg-[#6838eb] shadow-md shadow-purple-500/20 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Giao dịch</span>
            </button>

            {/* Nút làm mới */}
            <button
              onClick={fetchDashboardData}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <RotateCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>

            {/* Avatar */}
            <div
              onClick={() => navigate("/profile")}
              className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 text-white flex items-center justify-center font-bold text-xs cursor-pointer shadow-sm"
            >
              U
            </div>
          </div>
        </header>

        {/* NỘI DUNG DASHBOARD */}
        <div className="p-8 space-y-6">
          
          {/* HÀNG 4 THẺ THỐNG KÊ GRADIENT CHUẨN GIAO DIỆN MẪU */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Tổng tài sản (Tím) */}
            <div className="rounded-3xl p-5 text-white bg-gradient-to-r from-[#9056fe] to-[#ab76ff] shadow-lg shadow-purple-400/20 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-purple-100">Tổng tài sản / Số dư</p>
                <h3 className="text-xl font-extrabold mt-1.5">{formatVND(summary.balance)}</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl">
                💳
              </div>
            </div>

            {/* Thu nhập tháng (Xanh lam) */}
            <div className="rounded-3xl p-5 text-white bg-gradient-to-r from-[#3c82f8] to-[#60a5fa] shadow-lg shadow-blue-400/20 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-100">Thu nhập tháng</p>
                <h3 className="text-xl font-extrabold mt-1.5">{formatVND(summary.total_income)}</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl">
                💵
              </div>
            </div>

            {/* Chi tiêu tháng (Đỏ hồng) */}
            <div className="rounded-3xl p-5 text-white bg-gradient-to-r from-[#ff5362] to-[#ff7b88] shadow-lg shadow-red-400/20 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-red-100">Chi tiêu tháng</p>
                <h3 className="text-xl font-extrabold mt-1.5">{formatVND(summary.total_expense)}</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl">
                🛒
              </div>
            </div>

            {/* Tiết kiệm / Số giao dịch (Xanh lá) */}
            <div className="rounded-3xl p-5 text-white bg-gradient-to-r from-[#10b981] to-[#34d399] shadow-lg shadow-emerald-400/20 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-100">Số lượng giao dịch</p>
                <h3 className="text-xl font-extrabold mt-1.5">{summary.transaction_count} lượt</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl">
                🐷
              </div>
            </div>
          </div>

          {/* HÀNG CÁC BIỂU ĐỒ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Biểu đồ cột: Thu - Chi theo tháng */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h2 className="text-sm font-bold text-slate-800">Thu - Chi theo tháng</h2>
              <div className="h-64 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" fontSize={11} stroke="#94a3b8" tickLine={false} />
                    <YAxis fontSize={11} stroke="#94a3b8" tickLine={false} tickFormatter={(v) => (v >= 1e6 ? `${v / 1e6}M` : v)} />
                    <Tooltip formatter={(v) => [formatVND(v)]} contentStyle={{ borderRadius: "12px", border: "none" }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                    <Bar name="Thu nhập" dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar name="Chi tiêu" dataKey="expense" fill="#ff5362" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Biểu đồ Donut: Chi tiêu theo danh mục */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h2 className="text-sm font-bold text-slate-800">Chi tiêu theo danh mục</h2>
              <div className="h-64 mt-4 flex items-center justify-center">
                {categoryExpenses.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryExpenses}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {categoryExpenses.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => [formatVND(v)]} contentStyle={{ borderRadius: "12px" }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-slate-400">Chưa có chi tiêu</p>
                )}
              </div>
            </div>

            {/* Bảng Giao dịch gần đây */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800 mb-3">Giao dịch gần đây</h2>
                <div className="space-y-3 overflow-y-auto max-h-56 pr-1">
                  {recentTransactions.slice(0, 4).map((tx) => {
                    const isIncome = tx.type === "income";
                    return (
                      <div key={tx.id} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs ${isIncome ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
                            {isIncome ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{tx.category_name || "Khác"}</p>
                            <p className="text-[10px] text-slate-400">{tx.note || "Không có ghi chú"}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-bold ${isIncome ? "text-emerald-600" : "text-rose-600"}`}>
                          {isIncome ? "+" : "-"}{formatVND(tx.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <button
                onClick={() => setShowTxModal(true)}
                className="w-full mt-3 py-2 text-center text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-xl transition"
              >
                + Thêm giao dịch mới
              </button>
            </div>

          </div>

        </div>
      </main>

      {/* ===================== MODAL THÊM GIAO DỊCH ===================== */}
      {showTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowTxModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-black text-slate-800 mb-1">Thêm Giao Dịch Mới</h2>
            <p className="text-xs text-slate-400 mb-5">Ghi chép lại các khoản chi hoặc thu nhập</p>

            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Loại giao dịch</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTxForm({ ...txForm, type: "expense" })}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${txForm.type === "expense" ? "bg-rose-50 border-rose-500 text-rose-600" : "border-slate-200 text-slate-500"}`}
                  >
                    Chi tiêu
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxForm({ ...txForm, type: "income" })}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${txForm.type === "income" ? "bg-emerald-50 border-emerald-500 text-emerald-600" : "border-slate-200 text-slate-500"}`}
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
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Danh mục</label>
                <select
                  value={txForm.category_id}
                  onChange={(e) => setTxForm({ ...txForm, category_id: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  {categoriesList.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.type === "expense" ? "Chi" : "Thu"})
                    </option>
                  ))}
                </select>
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
                disabled={formLoading}
                className="w-full py-3 bg-[#7a4bf6] hover:bg-[#6838eb] text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 mt-2"
              >
                {formLoading ? "Đang lưu..." : "Xác nhận thêm"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL THÊM DANH MỤC ===================== */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowCategoryModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-black text-slate-800 mb-1">Thêm Danh Mục Mới</h2>
            <p className="text-xs text-slate-400 mb-5">Phân loại quản lý chi tiêu rõ ràng hơn</p>

            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Tên danh mục</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Tiền trọ, Cà phê..."
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Loại danh mục</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCatForm({ ...catForm, type: "expense" })}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${catForm.type === "expense" ? "bg-rose-50 border-rose-500 text-rose-600" : "border-slate-200 text-slate-500"}`}
                  >
                    Khoản chi
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatForm({ ...catForm, type: "income" })}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${catForm.type === "income" ? "bg-emerald-50 border-emerald-500 text-emerald-600" : "border-slate-200 text-slate-500"}`}
                  >
                    Khoản thu
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full py-3 bg-[#7a4bf6] hover:bg-[#6838eb] text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 mt-2"
              >
                {formLoading ? "Đang tạo..." : "Tạo danh mục"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  RotateCw,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  FolderKanban,
  X,
  CreditCard,
  PiggyBank,
  TrendingUp,
  Receipt,
  Sparkles,
  ArrowRight
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
import {
  getDashboardSummary,
  getCategoryExpenses,
  getMonthlySummary,
  getRecentTransactions,
  getCategories,
  createTransaction,
  createCategory
} from "../services/api";

const PIE_COLORS = ["#ff5252", "#2979ff", "#b388ff", "#00e676", "#ff9100", "#ffd600", "#00bcd4"];

export default function Dashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    total_income: 0,
    total_expense: 0,
    balance: 0,
    transaction_count: 0,
  });
  const [categoryExpenses, setCategoryExpenses] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);

  // Modals
  const [showTxModal, setShowTxModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Forms
  const [txForm, setTxForm] = useState({
    amount: "",
    type: "expense",
    category_id: "",
    note: "",
  });
  const [catForm, setCatForm] = useState({
    name: "",
    type: "expense",
  });
  const [formLoading, setFormLoading] = useState(false);

  const formatVND = (val) => {
    return new Intl.NumberFormat("vi-VN").format(Number(val) || 0) + " đ";
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sum, catExp, months, recents, cats] = await Promise.all([
        getDashboardSummary().catch(() => ({ total_income: 0, total_expense: 0, balance: 0, transaction_count: 0 })),
        getCategoryExpenses().catch(() => []),
        getMonthlySummary().catch(() => []),
        getRecentTransactions().catch(() => []),
        getCategories().catch(() => []),
      ]);

      setSummary(sum || {});
      setCategoryExpenses(
        (catExp || []).map((c) => ({
          name: c.category_name,
          value: Number(c.total_amount),
        }))
      );

      // Nhóm dữ liệu tháng
      const monthsMap = {};
      (months || []).forEach((item) => {
        const key = `Th ${item.month}/${item.year ? item.year.toString().slice(-2) : ""}`;
        if (!monthsMap[key]) {
          monthsMap[key] = { label: key, income: 0, expense: 0 };
        }
        if (item.type === "income") monthsMap[key].income += Number(item.total_amount);
        if (item.type === "expense") monthsMap[key].expense += Number(item.total_amount);
      });
      setMonthlyData(Object.values(monthsMap));

      setRecentTransactions(recents || []);
      setCategoriesList(cats || []);
      if (cats?.length > 0 && !txForm.category_id) {
        setTxForm((prev) => ({ ...prev, category_id: cats[0].id }));
      }
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, [txForm.category_id]);

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener("transaction-updated", handleUpdate);
    return () => window.removeEventListener("transaction-updated", handleUpdate);
  }, [loadData]);

  // Thêm giao dịch
  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!txForm.amount || !txForm.category_id) {
      alert("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    setFormLoading(true);
    try {
      await createTransaction({
        amount: parseFloat(txForm.amount),
        type: txForm.type,
        category_id: parseInt(txForm.category_id),
        note: txForm.note,
      });

      setShowTxModal(false);
      setTxForm({
        amount: "",
        type: "expense",
        category_id: categoriesList[0]?.id || "",
        note: "",
      });
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || "Lỗi khi tạo giao dịch!");
    } finally {
      setFormLoading(false);
    }
  };

  // Thêm danh mục
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!catForm.name) return;

    setFormLoading(true);
    try {
      await createCategory({
        name: catForm.name,
        type: catForm.type,
      });

      setShowCategoryModal(false);
      setCatForm({ name: "", type: "expense" });
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || "Lỗi khi tạo danh mục!");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc]">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200/80 px-8 py-5 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <span>Tổng quan tài chính</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Theo dõi dòng tiền, thu nhập và chi tiêu của bạn</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 transition shadow-sm"
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>+ Danh mục</span>
          </button>

          <button
            onClick={() => setShowTxModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#7a4bf6] hover:bg-[#6838eb] shadow-md shadow-purple-500/20 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Giao dịch</span>
          </button>

          <button
            onClick={loadData}
            title="Làm mới dữ liệu"
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
          >
            <RotateCw className={`w-4 h-4 ${loading ? "animate-spin text-purple-600" : ""}`} />
          </button>
        </div>
      </header>

      {/* BODY */}
      <div className="p-6 lg:p-8 space-y-6">
        {/* 4 CARDS GRADIENT */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Số dư */}
          <div className="rounded-3xl p-6 text-white bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] shadow-lg shadow-purple-500/10 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-purple-100">Số dư hiện tại</p>
              <h3 className="text-2xl font-black mt-2 tracking-tight">{formatVND(summary.balance)}</h3>
              <p className="text-[11px] text-purple-200 mt-1">Thu nhập trừ chi phí</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner">
              💳
            </div>
          </div>

          {/* Thu nhập */}
          <div className="rounded-3xl p-6 text-white bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] shadow-lg shadow-blue-500/10 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-100">Tổng thu nhập</p>
              <h3 className="text-2xl font-black mt-2 tracking-tight">{formatVND(summary.total_income)}</h3>
              <p className="text-[11px] text-blue-100 mt-1">Tất cả nguồn thu</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner">
              💵
            </div>
          </div>

          {/* Chi tiêu */}
          <div className="rounded-3xl p-6 text-white bg-gradient-to-r from-[#f43f5e] to-[#fb7185] shadow-lg shadow-rose-500/10 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-rose-100">Tổng chi tiêu</p>
              <h3 className="text-2xl font-black mt-2 tracking-tight">{formatVND(summary.total_expense)}</h3>
              <p className="text-[11px] text-rose-100 mt-1">Đã tiêu dùng</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner">
              🛒
            </div>
          </div>

          {/* Số giao dịch */}
          <div className="rounded-3xl p-6 text-white bg-gradient-to-r from-[#10b981] to-[#34d399] shadow-lg shadow-emerald-500/10 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-100">Số lượng giao dịch</p>
              <h3 className="text-2xl font-black mt-2 tracking-tight">{summary.transaction_count} lượt</h3>
              <p className="text-[11px] text-emerald-100 mt-1">Lịch sử thu / chi</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner">
              📊
            </div>
          </div>
        </div>

        {/* CHARTS & RECENT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Biểu đồ cột: Thu - Chi theo tháng */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-800">Biến động Thu - Chi theo tháng</h2>
              <span className="text-[11px] text-slate-400">VND</span>
            </div>
            <div className="h-64">
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" fontSize={11} stroke="#94a3b8" tickLine={false} />
                    <YAxis
                      fontSize={11}
                      stroke="#94a3b8"
                      tickLine={false}
                      tickFormatter={(v) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v)}
                    />
                    <Tooltip formatter={(v) => [formatVND(v)]} contentStyle={{ borderRadius: "12px", border: "none" }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                    <Bar name="Thu nhập" dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar name="Chi tiêu" dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                  <Receipt className="w-8 h-8 stroke-1 text-slate-300 mb-2" />
                  <span>Chưa có dữ liệu theo tháng</span>
                </div>
              )}
            </div>
          </div>

          {/* Biểu đồ tròn: Chi tiêu theo danh mục */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-800">Chi tiêu theo danh mục</h2>
              <span className="text-[11px] text-slate-400">Tỷ lệ</span>
            </div>
            <div className="h-64 flex items-center justify-center">
              {categoryExpenses.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryExpenses}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {categoryExpenses.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [formatVND(v)]} contentStyle={{ borderRadius: "12px", border: "none" }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 text-xs">
                  <FolderKanban className="w-8 h-8 stroke-1 text-slate-300 mb-2" />
                  <span>Chưa ghi nhận chi tiêu</span>
                </div>
              )}
            </div>
          </div>

          {/* Giao dịch gần đây */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-800">Giao dịch gần đây</h2>
                <button
                  onClick={() => navigate("/transactions")}
                  className="text-xs font-semibold text-purple-600 hover:text-purple-700 inline-flex items-center gap-1"
                >
                  <span>Xem tất cả</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-56 pr-1">
                {recentTransactions.length > 0 ? (
                  recentTransactions.slice(0, 5).map((tx) => {
                    const isIncome = tx.type === "income";
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${
                              isIncome ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                            }`}
                          >
                            {isIncome ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{tx.category_name || "Giao dịch"}</p>
                            <p className="text-[10px] text-slate-400 truncate max-w-[120px]">
                              {tx.note || new Date(tx.occurred_at).toLocaleDateString("vi-VN")}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-xs font-extrabold ${
                            isIncome ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {isIncome ? "+" : "-"}
                          {formatVND(tx.amount)}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-slate-400 text-xs">Chưa có giao dịch nào</div>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowTxModal(true)}
              className="w-full mt-4 py-2.5 text-center text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-xl transition"
            >
              + Ghi chép giao dịch mới
            </button>
          </div>
        </div>

        {/* AI INSIGHT BANNER */}
        <div className="rounded-3xl p-6 bg-gradient-to-r from-purple-900 to-indigo-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-2xl">
              ✨
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Trợ lý Phân Tích Tài Chính AI</h3>
              <p className="text-xs text-purple-200 mt-0.5">
                Xem đánh giá sức khỏe tài chính, cảnh báo chi tiêu lãng phí và gợi ý phân bổ ngân sách 50/30/20.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/reports")}
            className="px-5 py-2.5 bg-white text-purple-900 font-bold text-xs rounded-xl shadow-sm hover:bg-purple-50 transition active:scale-95 shrink-0"
          >
            Khám phá báo cáo AI
          </button>
        </div>
      </div>

      {/* MODAL THÊM GIAO DỊCH */}
      {showTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-slate-100 relative">
            <button onClick={() => setShowTxModal(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-black text-slate-800">Thêm Giao Dịch Mới</h2>
            <p className="text-xs text-slate-400 mb-5">Ghi chép lại các khoản chi hoặc thu nhập</p>

            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Loại giao dịch</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTxForm({ ...txForm, type: "expense" })}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      txForm.type === "expense"
                        ? "bg-rose-50 border-rose-500 text-rose-600"
                        : "border-slate-200 text-slate-500"
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
                        : "border-slate-200 text-slate-500"
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
                  placeholder="Ví dụ: 100000"
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
                  {categoriesList
                    .filter((c) => c.type === txForm.type)
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Ghi chú</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Ăn trưa, Đổ xăng..."
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

      {/* MODAL THÊM DANH MỤC */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl border border-slate-100 relative">
            <button onClick={() => setShowCategoryModal(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-black text-slate-800">Thêm Danh Mục Mới</h2>
            <p className="text-xs text-slate-400 mb-5">Phân loại quản lý chi tiêu rõ ràng hơn</p>

            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Tên danh mục</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Tiền nhà, Du lịch..."
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
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      catForm.type === "expense"
                        ? "bg-rose-50 border-rose-500 text-rose-600"
                        : "border-slate-200 text-slate-500"
                    }`}
                  >
                    Khoản chi
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatForm({ ...catForm, type: "income" })}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      catForm.type === "income"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-600"
                        : "border-slate-200 text-slate-500"
                    }`}
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


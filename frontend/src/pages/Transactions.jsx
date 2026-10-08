import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Trash2,
  Edit2,
  Search,
  Filter,
  RotateCw,
  X,
  Calendar,
  AlertCircle
} from "lucide-react";
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getCategories
} from "../services/api";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState("all"); // 'all' | 'income' | 'expense'
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [formData, setFormData] = useState({
    amount: "",
    type: "expense",
    category_id: "",
    note: "",
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  const formatVND = (val) => {
    return new Intl.NumberFormat("vi-VN").format(Number(val) || 0) + " đ";
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (typeFilter !== "all") params.type = typeFilter;
      if (selectedCategory !== "all") params.category_id = selectedCategory;

      const [txList, catList] = await Promise.all([
        getTransactions(params),
        getCategories(),
      ]);

      setTransactions(txList || []);
      setCategories(catList || []);
    } catch (err) {
      console.error("Lỗi khi tải giao dịch:", err);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, selectedCategory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    setEditingTx(null);
    setFormData({
      amount: "",
      type: "expense",
      category_id: categories.find((c) => c.type === "expense")?.id || categories[0]?.id || "",
      note: "",
    });
    setShowModal(true);
  };

  const handleOpenEdit = (tx) => {
    setEditingTx(tx);
    setFormData({
      amount: tx.amount.toString(),
      type: tx.type,
      category_id: tx.category_id || "",
      note: tx.note || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.category_id) {
      alert("Vui lòng điền đủ thông tin!");
      return;
    }

    setFormSubmitting(true);
    try {
      if (editingTx) {
        await updateTransaction(editingTx.id, {
          amount: parseFloat(formData.amount),
          type: formData.type,
          category_id: parseInt(formData.category_id),
          note: formData.note,
        });
      } else {
        await createTransaction({
          amount: parseFloat(formData.amount),
          type: formData.type,
          category_id: parseInt(formData.category_id),
          note: formData.note,
        });
      }

      setShowModal(false);
      window.dispatchEvent(new Event("transaction-updated"));
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || "Thao tác không thành công!");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa giao dịch này?")) return;

    try {
      await deleteTransaction(id);
      window.dispatchEvent(new Event("transaction-updated"));
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || "Không thể xóa giao dịch!");
    }
  };

  // Lọc tìm kiếm theo note hoặc tên danh mục
  const filteredTransactions = transactions.filter((tx) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const noteMatch = tx.note?.toLowerCase().includes(term);
    const catMatch = tx.category_name?.toLowerCase().includes(term);
    return noteMatch || catMatch;
  });

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc]">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200/80 px-8 py-5 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Sổ Giao Dịch</h1>
          <p className="text-xs text-slate-400 mt-0.5">Quản lý và thống kê chi tiết các khoản thu chi</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#7a4bf6] hover:bg-[#6838eb] shadow-md shadow-purple-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm giao dịch</span>
          </button>
          <button
            onClick={loadData}
            title="Làm mới"
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
          >
            <RotateCw className={`w-4 h-4 ${loading ? "animate-spin text-purple-600" : ""}`} />
          </button>
        </div>
      </header>

      {/* FILTER BAR */}
      <div className="p-6 lg:p-8 space-y-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Nhóm Filter Loại */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full md:w-auto">
            <button
              onClick={() => setTypeFilter("all")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition ${
                typeFilter === "all" ? "bg-white text-purple-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setTypeFilter("income")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition ${
                typeFilter === "income" ? "bg-emerald-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Thu nhập
            </button>
            <button
              onClick={() => setTypeFilter("expense")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition ${
                typeFilter === "expense" ? "bg-rose-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Chi tiêu
            </button>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Lọc theo Danh mục */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="all">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.type === "expense" ? "Chi" : "Thu"})
                </option>
              ))}
            </select>

            {/* Tìm kiếm */}
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm ghi chú, danh mục..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
          </div>
        </div>

        {/* DANH SÁCH GIAO DỊCH */}
        <div className="bg-white rounded-3xl border border-slate-200/70 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[11px] tracking-wider">
                <tr>
                  <th className="py-4 px-6">Giao dịch</th>
                  <th className="py-4 px-6">Danh mục</th>
                  <th className="py-4 px-6">Ghi chú</th>
                  <th className="py-4 px-6">Thời gian</th>
                  <th className="py-4 px-6 text-right">Số tiền</th>
                  <th className="py-4 px-6 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((tx) => {
                    const isIncome = tx.type === "income";
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                                isIncome ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                              }`}
                            >
                              {isIncome ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                            </div>
                            <span className="font-bold text-slate-800">
                              {isIncome ? "Khoản thu" : "Khoản chi"}
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 font-semibold">
                            {tx.category_name || "Chưa phân loại"}
                          </span>
                        </td>

                        <td className="py-4 px-6 max-w-xs truncate text-slate-500">
                          {tx.note || <span className="italic text-slate-300">Không có ghi chú</span>}
                        </td>

                        <td className="py-4 px-6 text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{new Date(tx.occurred_at).toLocaleDateString("vi-VN")}</span>
                          </div>
                        </td>

                        <td className="py-4 px-6 text-right">
                          <span
                            className={`font-black text-sm ${
                              isIncome ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {isIncome ? "+" : "-"}
                            {formatVND(tx.amount)}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenEdit(tx)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition"
                              title="Sửa"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(tx.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400">
                      {loading ? "Đang tải dữ liệu..." : "Không tìm thấy giao dịch nào"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL THÊM / SỬA GIAO DỊCH */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-slate-100 relative">
            <button onClick={() => setShowModal(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-black text-slate-800">
              {editingTx ? "Chỉnh Sửa Giao Dịch" : "Thêm Giao Dịch Mới"}
            </h2>
            <p className="text-xs text-slate-400 mb-5">
              {editingTx ? "Cập nhật thông tin giao dịch đã chọn" : "Nhập chi tiết khoản thu hoặc chi"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Loại giao dịch</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: "expense" })}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      formData.type === "expense"
                        ? "bg-rose-50 border-rose-500 text-rose-600"
                        : "border-slate-200 text-slate-500"
                    }`}
                  >
                    Chi tiêu
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: "income" })}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      formData.type === "income"
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
                  placeholder="Ví dụ: 150000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Danh mục</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  {categories
                    .filter((c) => c.type === formData.type)
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
                  placeholder="Ví dụ: Tiền chợ, Tiền lương..."
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <button
                type="submit"
                disabled={formSubmitting}
                className="w-full py-3 bg-[#7a4bf6] hover:bg-[#6838eb] text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 mt-2"
              >
                {formSubmitting ? "Đang lưu..." : editingTx ? "Lưu thay đổi" : "Xác nhận thêm"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


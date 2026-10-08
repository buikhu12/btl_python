import React, { useState, useEffect } from "react";
import { FolderKanban, Plus, Trash2, Edit2, RotateCw, X, Tag } from "lucide-react";
import { getCategories, createCategory, deleteCategory } from "../services/api";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'expense' | 'income'

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "expense",
  });
  const [submitting, setSubmitting] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await getCategories();
      setCategories(data || []);
    } catch (err) {
      console.error("Lỗi khi tải danh mục:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSubmitting(true);
    try {
      await createCategory({
        name: formData.name.trim(),
        type: formData.type,
      });

      setShowModal(false);
      setFormData({ name: "", type: "expense" });
      loadCategories();
    } catch (err) {
      alert(err.response?.data?.detail || "Không thể tạo danh mục!");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa danh mục này?")) return;

    try {
      await deleteCategory(id);
      loadCategories();
    } catch (err) {
      alert(err.response?.data?.detail || "Không thể xóa danh mục này (có thể đang có giao dịch liên kết).");
    }
  };

  const filtered = categories.filter((c) => {
    if (activeTab === "all") return true;
    return c.type === activeTab;
  });

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories = categories.filter((c) => c.type === "income");

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc]">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200/80 px-8 py-5 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Quản Lý Danh Mục</h1>
          <p className="text-xs text-slate-400 mt-0.5">Phân loại các khoản chi tiêu và nguồn thu nhập</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setFormData({ name: "", type: activeTab === "income" ? "income" : "expense" });
              setShowModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#7a4bf6] hover:bg-[#6838eb] shadow-md shadow-purple-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm danh mục</span>
          </button>

          <button
            onClick={loadCategories}
            title="Làm mới"
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
          >
            <RotateCw className={`w-4 h-4 ${loading ? "animate-spin text-purple-600" : ""}`} />
          </button>
        </div>
      </header>

      {/* BODY */}
      <div className="p-6 lg:p-8 space-y-6">
        {/* TABS */}
        <div className="flex items-center gap-2 p-1.5 bg-white border border-slate-200/70 rounded-2xl w-fit shadow-sm">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === "all" ? "bg-purple-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Tất cả ({categories.length})
          </button>
          <button
            onClick={() => setActiveTab("expense")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === "expense" ? "bg-rose-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Khoản chi ({expenseCategories.length})
          </button>
          <button
            onClick={() => setActiveTab("income")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === "income" ? "bg-emerald-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Khoản thu ({incomeCategories.length})
          </button>
        </div>

        {/* GRID OF CATEGORY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((cat) => {
            const isIncome = cat.type === "income";
            return (
              <div
                key={cat.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm flex items-center justify-between hover:shadow-md transition group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      isIncome ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    }`}
                  >
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">{cat.name}</h3>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                        isIncome ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {isIncome ? "Khoản thu" : "Khoản chi"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(cat.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                  title="Xóa danh mục"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && !loading && (
          <div className="bg-white p-12 rounded-3xl border border-slate-200/70 text-center text-slate-400 text-xs">
            Chưa có danh mục nào thuộc nhóm này. Hãy thêm danh mục mới!
          </div>
        )}
      </div>

      {/* MODAL THÊM DANH MỤC */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl border border-slate-100 relative">
            <button onClick={() => setShowModal(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-black text-slate-800 mb-1">Thêm Danh Mục Mới</h2>
            <p className="text-xs text-slate-400 mb-5">Tạo phân loại mới cho thu chi của bạn</p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Tên danh mục</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Cà phê, Du lịch, Thưởng Tết..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Loại danh mục</label>
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
                    Khoản chi
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
                    Khoản thu
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-[#7a4bf6] hover:bg-[#6838eb] text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 mt-2"
              >
                {submitting ? "Đang tạo..." : "Xác nhận tạo danh mục"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


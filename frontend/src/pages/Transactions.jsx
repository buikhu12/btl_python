import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  AlertCircle,
  CheckCircle2,
  WifiOff
} from "lucide-react";
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getCategories,
  createCategory,
  seedDefaultCategories,
  generateIdempotencyKey,
  getTransactionByIdempotencyKey
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
    occurred_at: new Date().toISOString().slice(0, 16),
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Quản lý Idempotency Key duy nhất cho phiên tạo giao dịch hiện tại (giữ nguyên khi retry)
  const [currentIdempotencyKey, setCurrentIdempotencyKey] = useState(null);
  const [isNetworkError, setIsNetworkError] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // Quick category creation inside modal
  const [showQuickAddCat, setShowQuickAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [catActionLoading, setCatActionLoading] = useState(false);

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

  // Lắng nghe sự kiện cập nhật danh mục từ các trang hoặc modal khác
  useEffect(() => {
    const handleCategoriesUpdated = async () => {
      try {
        const cats = await getCategories();
        setCategories(cats || []);
      } catch (err) {
        console.error("Lỗi đồng bộ danh mục:", err);
      }
    };
    window.addEventListener("categories-updated", handleCategoriesUpdated);
    return () => window.removeEventListener("categories-updated", handleCategoriesUpdated);
  }, []);

  // Lắng nghe sự kiện giao dịch mới từ Kế hoạch chi tiêu, Dashboard, Quick Add...
  useEffect(() => {
    const handleTransactionsUpdated = () => {
      loadData();
    };
    window.addEventListener("transaction-updated", handleTransactionsUpdated);
    window.addEventListener("focus", handleTransactionsUpdated);
    return () => {
      window.removeEventListener("transaction-updated", handleTransactionsUpdated);
      window.removeEventListener("focus", handleTransactionsUpdated);
    };
  }, [loadData]);

  // Khi có mạng lại (sự kiện 'online'):
  // Frontend kiểm tra xem giao dịch đã vào DB chưa hoặc gửi lại với cùng key
  useEffect(() => {
    const handleNetworkBackOnline = async () => {
      if (isNetworkError && currentIdempotencyKey && showModal) {
        setStatusMessage("Đã có mạng trở lại! Đang tự động kiểm tra trạng thái giao dịch theo key...");
        try {
          // Gọi API tra cứu trạng thái theo key
          const res = await getTransactionByIdempotencyKey(currentIdempotencyKey);
          if (res && res.transaction) {
            setStatusMessage(`Giao dịch đã được lưu thành công trên hệ thống! Số dư ví hiện tại: ${formatVND(res.current_balance)}.`);
            setTimeout(() => {
              setShowModal(false);
              setCurrentIdempotencyKey(null);
              setIsNetworkError(false);
              setStatusMessage("");
              window.dispatchEvent(new Event("transaction-updated"));
              window.dispatchEvent(new Event("wallets-updated"));
              loadData();
            }, 1500);
            return;
          }
        } catch (checkErr) {
          // Nếu backend trả về 404 (chưa nhận được request trước), tự động gửi lại với CÙNG key
          if (checkErr.response && checkErr.response.status === 404) {
            setStatusMessage("Kết nối mạng đã khôi phục. Đang tự động gửi lại giao dịch với cùng khóa idempotency_key...");
            handleSubmit();
          }
        }
      }
    };

    window.addEventListener("online", handleNetworkBackOnline);
    return () => window.removeEventListener("online", handleNetworkBackOnline);
  }, [isNetworkError, currentIdempotencyKey, showModal, formData]);

  // Tra cứu category_name từ categories khi backend không trả trường này
  const categoryMap = useMemo(() => {
    const map = {};
    categories.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [categories]);

  const getCategoryName = (tx) => {
    return tx.category_name || categoryMap[tx.category_id] || "Chưa phân loại";
  };

  const handleOpenCreate = async () => {
    setEditingTx(null);
    // Sinh 1 idempotency_key duy nhất khi bắt đầu mở form tạo giao dịch
    const newKey = generateIdempotencyKey();
    setCurrentIdempotencyKey(newKey);
    setIsNetworkError(false);
    setStatusMessage("");

    let cats = categories;
    if (!cats || cats.length === 0) {
      try {
        cats = await getCategories();
        setCategories(cats || []);
      } catch (err) {
        console.error("Lỗi tải danh mục:", err);
      }
    }
    const matched = (cats || []).find((c) => c.type === "expense");
    setFormData({
      amount: "",
      type: "expense",
      category_id: matched ? matched.id : cats?.[0]?.id || "",
      note: "",
      occurred_at: new Date().toISOString().slice(0, 16),
    });
    setShowQuickAddCat(false);
    setNewCatName("");
    setShowModal(true);
  };

  const handleOpenEdit = (tx) => {
    setEditingTx(tx);
    setCurrentIdempotencyKey(null);
    setIsNetworkError(false);
    setStatusMessage("");
    setFormData({
      amount: tx.amount.toString(),
      type: tx.type,
      category_id: tx.category_id || "",
      note: tx.note || "",
      occurred_at: tx.occurred_at
        ? new Date(tx.occurred_at).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16),
    });
    setShowQuickAddCat(false);
    setNewCatName("");
    setShowModal(true);
  };

  const handleTypeChange = (newType) => {
    const matched = categories.find((c) => c.type === newType);
    setFormData((prev) => ({
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
        type: formData.type,
      });
      const updatedCats = [...categories, created];
      setCategories(updatedCats);
      setFormData((prev) => ({ ...prev, category_id: created.id }));
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
      const matched = (seeded || []).find((c) => c.type === formData.type);
      if (matched) {
        setFormData((prev) => ({ ...prev, category_id: matched.id }));
      }
    } catch (err) {
      alert("Không thể khởi tạo danh mục mẫu!");
    } finally {
      setCatActionLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.amount) {
      alert("Vui lòng nhập số tiền!");
      return;
    }
    if (!formData.category_id) {
      alert("Vui lòng chọn danh mục phù hợp trước khi gửi!");
      return;
    }

    setFormSubmitting(true);
    setStatusMessage("");
    try {
      const payload = {
        amount: parseFloat(formData.amount),
        type: formData.type,
        category_id: parseInt(formData.category_id),
        note: formData.note,
        occurred_at: formData.occurred_at
          ? new Date(formData.occurred_at).toISOString()
          : new Date().toISOString(),
      };

      if (editingTx) {
        await updateTransaction(editingTx.id, payload);
      } else {
        // Lấy key duy nhất hiện tại hoặc tạo mới nếu chưa có
        // Quan trọng: KHI RETRY THÌ GIỮ NGUYÊN KEY NÀY để backend không cộng/trừ ví lần 2
        const keyToUse = currentIdempotencyKey || generateIdempotencyKey();
        if (!currentIdempotencyKey) {
          setCurrentIdempotencyKey(keyToUse);
        }
        await createTransaction(payload, keyToUse);
      }

      // Tạo giao dịch thành công: reset key và đóng modal
      setShowModal(false);
      setCurrentIdempotencyKey(null);
      setIsNetworkError(false);
      setStatusMessage("");
      window.dispatchEvent(new Event("transaction-updated"));
      window.dispatchEvent(new Event("wallets-updated"));
      loadData();
    } catch (err) {
      console.error("Lỗi khi gửi giao dịch:", err);
      // Kiểm tra lỗi mất kết nối mạng hoặc server không phản hồi
      const isNet = !err.response || err.code === "ERR_NETWORK" || !navigator.onLine;
      if (isNet) {
        setIsNetworkError(true);
        setStatusMessage(
          "Mất kết nối mạng hoặc không nhận được phản hồi từ server! Khóa idempotency_key vẫn được giữ nguyên an toàn. Bạn có thể bấm 'Thử gửi lại' hoặc 'Tra cứu trạng thái' mà không lo bị nhân đôi giao dịch."
        );
      } else {
        alert(err.response?.data?.detail || "Thao tác không thành công!");
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  // Hàm tra cứu trạng thái giao dịch theo idempotency_key (Backend trả về giao dịch và số dư ví hiện tại)
  const handleCheckStatusByKey = async () => {
    if (!currentIdempotencyKey) return;
    setCheckingStatus(true);
    setStatusMessage("");
    try {
      const res = await getTransactionByIdempotencyKey(currentIdempotencyKey);
      if (res && res.transaction) {
        setStatusMessage(
          `Giao dịch đã được lưu thành công trên hệ thống! Số dư ví hiện tại: ${formatVND(res.current_balance)}.`
        );
        setTimeout(() => {
          setShowModal(false);
          setCurrentIdempotencyKey(null);
          setIsNetworkError(false);
          setStatusMessage("");
          window.dispatchEvent(new Event("transaction-updated"));
          window.dispatchEvent(new Event("wallets-updated"));
          loadData();
        }, 1800);
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setStatusMessage(
          "Chưa tìm thấy giao dịch này trên server (request trước đó chưa tới server). Bạn có thể an tâm bấm 'Thử gửi lại' với cùng khóa này."
        );
      } else {
        setStatusMessage(err.response?.data?.detail || "Lỗi khi kiểm tra trạng thái giao dịch!");
      }
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa giao dịch này?")) return;

    try {
      await deleteTransaction(id);
      window.dispatchEvent(new Event("transaction-updated"));
      window.dispatchEvent(new Event("wallets-updated"));
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || "Không thể xóa giao dịch!");
    }
  };

  // Lọc tìm kiếm theo note hoặc tên danh mục và sắp xếp giao dịch mới nhất lên đầu
  const filteredTransactions = useMemo(() => {
    const list = transactions.filter((tx) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const noteMatch = tx.note?.toLowerCase().includes(term);
      const catMatch = getCategoryName(tx).toLowerCase().includes(term);
      return noteMatch || catMatch;
    });

    return [...list].sort((a, b) => {
      const timeDiff = new Date(b.occurred_at || 0) - new Date(a.occurred_at || 0);
      if (timeDiff !== 0) return timeDiff;
      return (b.id || 0) - (a.id || 0);
    });
  }, [transactions, searchTerm, categoryMap]);

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc]">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200/80 px-8 py-5 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black text-slate-800 tracking-tight">Sổ Giao Dịch</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[11px] font-bold border border-purple-200">
              {filteredTransactions.length} giao dịch
            </span>
          </div>
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
        </div>
      </header>

      {/* FILTER & SEARCH BAR */}
      <div className="p-8 pb-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
            {/* Filter Type */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setTypeFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  typeFilter === "all" ? "bg-white text-purple-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setTypeFilter("expense")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  typeFilter === "expense" ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Chi tiêu
              </button>
              <button
                onClick={() => setTypeFilter("income")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  typeFilter === "income" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Thu nhập
              </button>
            </div>

            {/* Filter Category */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-slate-100 border-none rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="all">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.type === "income" ? "Thu" : "Chi"})
                </option>
              ))}
            </select>
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo ghi chú..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
        </div>
      </div>

      {/* TABLE DATA */}
      <div className="px-8 pb-8 flex-1">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          {loading ? (
            <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <RotateCw className="w-6 h-6 animate-spin text-purple-600" />
              <span className="text-xs">Đang tải dữ liệu...</span>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <p className="text-sm">Không có giao dịch nào phù hợp</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-wider bg-slate-50/50">
                    <th className="py-4 px-6">Thời gian</th>
                    <th className="py-4 px-6">Danh mục</th>
                    <th className="py-4 px-6">Ghi chú</th>
                    <th className="py-4 px-6 text-right">Số tiền</th>
                    <th className="py-4 px-6 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredTransactions.map((tx) => {
                    const isExpense = tx.type === "expense";
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/60 transition group">
                        <td className="py-4 px-6 text-slate-500 whitespace-nowrap">
                          {new Date(tx.occurred_at).toLocaleString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-700 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-[11px]">
                            {getCategoryName(tx)}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-600 font-medium">
                          <div className="flex flex-col">
                            <span>{tx.note || "—"}</span>
                            {tx.idempotency_key && (
                              <span className="text-[10px] text-slate-400 font-mono truncate max-w-xs" title={tx.idempotency_key}>
                                key: {tx.idempotency_key.slice(0, 16)}...
                              </span>
                            )}
                          </div>
                        </td>
                        <td className={`py-4 px-6 font-black text-right whitespace-nowrap text-sm ${isExpense ? "text-rose-500" : "text-emerald-500"}`}>
                          {isExpense ? "-" : "+"}
                          {formatVND(tx.amount)}
                        </td>
                        <td className="py-4 px-6 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2 opacity-80 group-hover:opacity-100">
                            <button
                              onClick={() => handleOpenEdit(tx)}
                              className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                              title="Chỉnh sửa"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(tx.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL THÊM / CHỈNH SỬA GIAO DỊCH */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowModal(false);
                setIsNetworkError(false);
                setStatusMessage("");
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-black text-slate-800">
              {editingTx ? "Chỉnh Sửa Giao Dịch" : "Thêm Giao Dịch Mới"}
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              {editingTx ? "Cập nhật thông tin giao dịch đã chọn" : "Nhập chi tiết khoản thu hoặc chi"}
            </p>

            {/* Hiển thị idempotency_key đang sử dụng khi tạo giao dịch mới */}
            {!editingTx && currentIdempotencyKey && (
              <div className="mb-3 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span className="text-slate-400 font-sans">Khóa gửi (Idempotency Key):</span>
                <span className="font-bold text-purple-700 truncate max-w-[170px]" title={currentIdempotencyKey}>
                  {currentIdempotencyKey}
                </span>
              </div>
            )}

            {/* KHUNG THÔNG BÁO KHI GẶP LỖI MẠNG HOẶC KHI RETRY */}
            {isNetworkError && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2.5 animate-in fade-in">
                <div className="flex items-start gap-2">
                  <WifiOff className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-xs text-amber-900 leading-relaxed font-medium">
                    {statusMessage || "Mất kết nối mạng! Khóa idempotency_key vẫn được giữ nguyên an toàn."}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={formSubmitting}
                    onClick={() => handleSubmit()}
                    className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-sm"
                  >
                    {formSubmitting ? "Đang gửi lại..." : "Thử gửi lại (Cùng key)"}
                  </button>
                  <button
                    type="button"
                    disabled={checkingStatus}
                    onClick={handleCheckStatusByKey}
                    className="flex-1 py-2 px-3 bg-white border border-amber-300 hover:bg-amber-100/60 disabled:opacity-50 text-amber-900 text-xs font-bold rounded-xl transition"
                  >
                    {checkingStatus ? "Đang kiểm tra..." : "Tra cứu trạng thái"}
                  </button>
                </div>
              </div>
            )}

            {/* Thông báo trạng thái tra cứu thành công hoặc thông tin */}
            {statusMessage && !isNetworkError && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2 text-xs text-emerald-800 font-medium animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Loại giao dịch</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleTypeChange("expense")}
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
                    onClick={() => handleTypeChange("income")}
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
                      Tạo danh mục mới cho khoản <span className="font-bold underline">{formData.type === "expense" ? "Chi tiêu" : "Thu nhập"}</span>:
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

                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium"
                >
                  {!formData.category_id && (
                    <option value="">-- Chọn danh mục --</option>
                  )}
                  {categories
                    .filter((c) => c.type === formData.type)
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  {categories.filter((c) => c.type === formData.type).length === 0 && (
                    <option value="" disabled>
                      Chưa có danh mục loại này
                    </option>
                  )}
                </select>

                {categories.filter((c) => c.type === formData.type).length === 0 && (
                  <div className="mt-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-2">
                    <span className="text-[11px] text-amber-700 font-medium">
                      Chưa có danh mục {formData.type === "expense" ? "chi tiêu" : "thu nhập"}.
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
                  value={formData.occurred_at}
                  onChange={(e) => setFormData({ ...formData, occurred_at: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold"
                />
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

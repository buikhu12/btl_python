import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarCheck,
  Plus,
  RotateCw,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Tag,
  Repeat,
  Calendar,
  Trash2,
  Edit2,
  TrendingDown,
  PieChart as BudgetIcon,
  X
} from "lucide-react";
import {
  getPlannedExpenses,
  createPlannedExpense,
  updatePlannedExpense,
  deletePlannedExpense,
  getBudgetProgress,
  getCategories
} from "../services/api";

export default function PlannedExpenses() {
  const navigate = useNavigate();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [budgetData, setBudgetData] = useState(null);
  const [categories, setCategories] = useState([]);

  // Filter & Search
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'PENDING' | 'COMPLETED' | 'CANCELLED'
  const [searchTerm, setSearchTerm] = useState("");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    estimated_amount: "",
    category_id: "",
    planned_date: "",
    is_recurring: false,
    status: "PENDING",
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const formatVND = (val) => {
    return new Intl.NumberFormat("vi-VN").format(Number(val) || 0) + " đ";
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [plansData, bData, catsData] = await Promise.all([
        getPlannedExpenses(selectedMonth, selectedYear).catch(() => []),
        getBudgetProgress(selectedMonth, selectedYear).catch(() => null),
        getCategories().catch(() => []),
      ]);

      setPlans(plansData || []);
      setBudgetData(bData);
      setCategories(catsData || []);
    } catch (err) {
      console.error("Lỗi khi tải kế hoạch chi tiêu:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Danh mục map để hiển thị tên
  const categoryMap = useMemo(() => {
    const map = {};
    categories.forEach((c) => {
      map[c.id] = c;
    });
    return map;
  }, [categories]);

  const expenseCategories = useMemo(() => {
    return categories.filter((c) => c.type === "expense");
  }, [categories]);

  // Tính toán số liệu tổng quan
  const budgetLimit = Number(budgetData?.amount_limit || 0);
  const actualSpent = Number(budgetData?.total_spent || 0);

  // Tổng tiền các kế hoạch dự tính (không tính đã hủy)
  const totalEstimated = useMemo(() => {
    return plans
      .filter((p) => p.status !== "CANCELLED")
      .reduce((acc, cur) => acc + Number(cur.estimated_amount || 0), 0);
  }, [plans]);

  // Hạn mức dự tính còn có thể thêm vào kế hoạch
  const availablePlanCapacity = Math.max(0, budgetLimit - totalEstimated);
  const planUsagePercentage = budgetLimit > 0 ? Math.round((totalEstimated / budgetLimit) * 100) : 0;

  // Lọc kế hoạch
  const filteredPlans = plans.filter((plan) => {
    if (statusFilter !== "all" && plan.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchTitle = plan.title?.toLowerCase().includes(term);
      const catName = categoryMap[plan.category_id]?.name || "";
      const matchCategory = catName.toLowerCase().includes(term);
      return matchTitle || matchCategory;
    }
    return true;
  });

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setFormError("");
    setFormData({
      title: "",
      estimated_amount: "",
      category_id: expenseCategories[0]?.id ? expenseCategories[0].id.toString() : "",
      planned_date: new Date(selectedYear, selectedMonth - 1, 15).toISOString().slice(0, 10),
      is_recurring: false,
      status: "PENDING",
    });
    setShowModal(true);
  };

  const handleOpenEdit = (plan) => {
    setEditingPlan(plan);
    setFormError("");
    setFormData({
      title: plan.title,
      estimated_amount: plan.estimated_amount.toString(),
      category_id: plan.category_id ? plan.category_id.toString() : "",
      planned_date: plan.planned_date ? plan.planned_date.slice(0, 10) : "",
      is_recurring: Boolean(plan.is_recurring),
      status: plan.status || "PENDING",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.title.trim()) {
      setFormError("Vui lòng nhập tên mục kế hoạch!");
      return;
    }
    const amountNum = parseFloat(formData.estimated_amount);
    if (!amountNum || amountNum <= 0) {
      setFormError("Số tiền dự tính phải lớn hơn 0!");
      return;
    }

    if (!budgetLimit) {
      setFormError("Tháng này chưa có Ngân sách! Bạn cần thiết lập Ngân sách trước khi tạo kế hoạch.");
      return;
    }

    setFormSubmitting(true);
    try {
      if (editingPlan) {
        // Cập nhật
        const payload = {
          title: formData.title.trim(),
          estimated_amount: amountNum,
          category_id: formData.category_id ? parseInt(formData.category_id) : null,
          planned_date: formData.planned_date || null,
          is_recurring: formData.is_recurring,
          status: formData.status,
        };
        await updatePlannedExpense(editingPlan.id, payload);
      } else {
        // Tạo mới
        const payload = {
          title: formData.title.trim(),
          estimated_amount: amountNum,
          category_id: formData.category_id ? parseInt(formData.category_id) : null,
          planned_date: formData.planned_date || null,
          is_recurring: formData.is_recurring,
          month: selectedMonth,
          year: selectedYear,
        };
        await createPlannedExpense(payload);
      }

      setShowModal(false);
      loadData();
    } catch (err) {
      setFormError(err.response?.data?.detail || "Không thể lưu kế hoạch chi tiêu!");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleQuickStatusChange = async (plan, nextStatus) => {
    try {
      await updatePlannedExpense(plan.id, { status: nextStatus });
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || "Không thể đổi trạng thái kế hoạch!");
    }
  };

  const handleDelete = async (planId) => {
    if (!window.confirm("Bạn có chắc muốn xóa mục kế hoạch này?")) return;
    try {
      await deletePlannedExpense(planId);
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || "Không thể xóa mục kế hoạch!");
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc]">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200/80 px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <span>Kế Hoạch Chi Tiêu Tháng</span>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold uppercase tracking-wider border border-purple-200">
              Dự Tính Ngân Sách
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Lập danh sách các khoản chi dự kiến và kiểm soát không vượt trần ngân sách
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Bộ chọn tháng & năm */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                Tháng {m}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                Năm {y}
              </option>
            ))}
          </select>

          <button
            onClick={loadData}
            title="Làm mới"
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
          >
            <RotateCw className={`w-4 h-4 ${loading ? "animate-spin text-purple-600" : ""}`} />
          </button>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#7a4bf6] hover:bg-[#6838eb] shadow-md shadow-purple-500/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Thêm kế hoạch</span>
          </button>
        </div>
      </header>

      {/* BODY */}
      <div className="p-6 lg:p-8 space-y-6">
        {/* CẢNH BÁO NẾU CHƯA CÓ NGÂN SÁCH */}
        {!budgetLimit && !loading && (
          <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-900">
                  Tháng {selectedMonth}/{selectedYear} chưa được thiết lập Ngân sách!
                </h3>
                <p className="text-xs text-amber-700 mt-0.5">
                  Hệ thống yêu cầu có Hạn mức Ngân sách trước để đảm bảo các khoản chi dự tính không vượt trần tài chính.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/budgets")}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-sm whitespace-nowrap"
            >
              Thiết lập Ngân sách ngay
            </button>
          </div>
        )}

        {/* 4 CARDS THỐNG KÊ TỔNG QUAN */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Hạn mức ngân sách */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/70 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Ngân sách tháng</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <BudgetIcon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">
                {budgetLimit > 0 ? formatVND(budgetLimit) : "Chưa cài đặt"}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Trần ngân sách chi tiêu tối đa</p>
            </div>
          </div>

          {/* Card 2: Tổng tiền dự tính chi */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/70 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Tổng chi dự tính</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <CalendarCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-xl font-black text-blue-600 tracking-tight">
                {formatVND(totalEstimated)}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Chiếm {planUsagePercentage}% trần ngân sách
              </p>
            </div>
          </div>

          {/* Card 3: Khả dụng còn có thể lên kế hoạch */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/70 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Hạn mức dự tính còn lại</span>
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                  availablePlanCapacity > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                }`}
              >
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3
                className={`text-xl font-black tracking-tight ${
                  availablePlanCapacity > 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {formatVND(availablePlanCapacity)}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Có thể phân bổ thêm vào kế hoạch</p>
            </div>
          </div>

          {/* Card 4: Thực tế đã chi trong tháng */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/70 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Thực tế đã chi</span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-xl font-black text-rose-600 tracking-tight">
                {formatVND(actualSpent)}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Hoàn thành {plans.filter((p) => p.status === "COMPLETED").length}/{plans.length} mục
              </p>
            </div>
          </div>
        </div>

        {/* TIẾN ĐỘ PHÂN BỔ KẾ HOẠCH TRÊN NGÂN SÁCH */}
        {budgetLimit > 0 && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-2">
                <span>Phân bổ kế hoạch chi tiêu trên Ngân sách tháng:</span>
                <span className="font-black text-purple-700">{planUsagePercentage}%</span>
              </span>
              <span className="text-slate-400 font-medium">
                {formatVND(totalEstimated)} / {formatVND(budgetLimit)}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  planUsagePercentage > 90
                    ? "bg-rose-500"
                    : planUsagePercentage > 75
                    ? "bg-amber-500"
                    : "bg-purple-600"
                }`}
                style={{ width: `${Math.min(100, planUsagePercentage)}%` }}
              />
            </div>
          </div>
        )}

        {/* THANH TÌM KIẾM & BỘ LỌC TRẠNG THÁI */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Nhóm Filter Trạng thái */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full md:w-auto overflow-x-auto">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                statusFilter === "all" ? "bg-white text-purple-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Tất cả ({plans.length})
            </button>
            <button
              onClick={() => setStatusFilter("PENDING")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                statusFilter === "PENDING" ? "bg-white text-amber-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Chờ chi ({plans.filter((p) => p.status === "PENDING").length})
            </button>
            <button
              onClick={() => setStatusFilter("COMPLETED")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                statusFilter === "COMPLETED" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Đã chi ({plans.filter((p) => p.status === "COMPLETED").length})
            </button>
            <button
              onClick={() => setStatusFilter("CANCELLED")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                statusFilter === "CANCELLED" ? "bg-white text-slate-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Đã hủy ({plans.filter((p) => p.status === "CANCELLED").length})
            </button>
          </div>

          {/* Ô Tìm Kiếm */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên kế hoạch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
        </div>

        {/* DANH SÁCH CÁC MỤC KẾ HOẠCH CHI TIÊU */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPlans.map((plan) => {
            const cat = categoryMap[plan.category_id];
            const isCompleted = plan.status === "COMPLETED";
            const isCancelled = plan.status === "CANCELLED";
            const isPending = plan.status === "PENDING";

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-3xl p-5 border shadow-sm transition hover:shadow-md flex flex-col justify-between relative group ${
                  isCompleted
                    ? "border-emerald-200/80 bg-emerald-50/20"
                    : isCancelled
                    ? "border-slate-200/60 opacity-60 bg-slate-50/50"
                    : "border-slate-200/80"
                }`}
              >
                <div>
                  {/* Top row: Category tag & Status badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-semibold">
                      <Tag className="w-3 h-3 text-purple-600" />
                      <span>{cat?.name || "Chi tiêu chung"}</span>
                    </span>

                    {/* Status badge */}
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                        <CheckCircle2 className="w-3 h-3" />
                        Đã chi
                      </span>
                    )}
                    {isPending && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                        <Clock className="w-3 h-3" />
                        Chờ chi
                      </span>
                    )}
                    {isCancelled && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">
                        <XCircle className="w-3 h-3" />
                        Đã hủy
                      </span>
                    )}
                  </div>

                  {/* Title & Recurring */}
                  <h3 className="font-extrabold text-sm text-slate-800 leading-snug line-clamp-2">
                    {plan.title}
                  </h3>

                  {plan.is_recurring && (
                    <div className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 mt-1">
                      <Repeat className="w-3 h-3" />
                      <span>Khoản chi định kỳ hàng tháng</span>
                    </div>
                  )}

                  {/* Amount display */}
                  <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-100/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                        Dự tính chi
                      </span>
                      <span className="text-base font-black text-slate-800">
                        {formatVND(plan.estimated_amount)}
                      </span>
                    </div>

                    {plan.planned_date && (
                      <div className="text-right">
                        <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                          Ngày dự kiến
                        </span>
                        <span className="text-xs font-bold text-slate-600 flex items-center gap-1 justify-end">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {new Date(plan.planned_date).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom row: Quick action buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {isPending && (
                      <button
                        onClick={() => handleQuickStatusChange(plan, "COMPLETED")}
                        title="Đánh dấu đã hoàn thành khoản chi này"
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold rounded-xl transition flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Đã chi</span>
                      </button>
                    )}
                    {isCompleted && (
                      <button
                        onClick={() => handleQuickStatusChange(plan, "PENDING")}
                        title="Chuyển lại trạng thái Chờ chi"
                        className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[11px] font-bold rounded-xl transition flex items-center gap-1"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Chờ chi</span>
                      </button>
                    )}
                    {!isCancelled && (
                      <button
                        onClick={() => handleQuickStatusChange(plan, "CANCELLED")}
                        title="Hủy kế hoạch này"
                        className="px-2 py-1.5 text-slate-400 hover:text-slate-600 text-[11px] font-medium rounded-xl hover:bg-slate-100 transition"
                      >
                        Hủy
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(plan)}
                      className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                      title="Sửa kế hoạch"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Xóa kế hoạch"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* EMPTY STATE */}
        {filteredPlans.length === 0 && !loading && (
          <div className="bg-white rounded-3xl p-12 border border-slate-200/70 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-inner">
              <CalendarCheck className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800">
                Chưa có kế hoạch chi tiêu nào trong tháng {selectedMonth}/{selectedYear}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Hãy chủ động lập danh sách các khoản chi dự kiến (tiền trọ, học phí, mua sắm...) để không vượt quá hạn mức ngân sách!
              </p>
            </div>
            <button
              onClick={handleOpenCreate}
              className="px-5 py-2.5 bg-[#7a4bf6] hover:bg-[#6838eb] text-white text-xs font-bold rounded-xl shadow-md shadow-purple-500/20 transition active:scale-95"
            >
              + Thêm kế hoạch chi tiêu đầu tiên
            </button>
          </div>
        )}
      </div>

      {/* MODAL THÊM / SỬA KẾ HOẠCH CHI TIÊU */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-xl hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-black text-slate-800 mb-1">
              {editingPlan ? "Chỉnh Sửa Kế Hoạch" : "Thêm Kế Hoạch Chi Tiêu"}
            </h2>
            <p className="text-xs text-slate-400 mb-5">
              Tháng {selectedMonth}/{selectedYear} • Ngân sách khả dụng:{" "}
              <span className="font-bold text-purple-600">{formatVND(availablePlanCapacity)}</span>
            </p>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Tên khoản dự tính <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Tiền nhà tháng này, Mua giáo trình, Bảo dưỡng xe..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Số tiền dự tính (VND) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1000"
                  placeholder="Ví dụ: 3000000"
                  value={formData.estimated_amount}
                  onChange={(e) => setFormData({ ...formData, estimated_amount: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold"
                />
                {formData.estimated_amount && (
                  <p className="text-[11px] text-purple-600 font-bold mt-1">
                    ≈ {formatVND(formData.estimated_amount)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Danh mục phân loại
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium"
                >
                  <option value="">-- Chi tiêu chung / Không phân loại --</option>
                  {expenseCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Ngày dự kiến chi
                </label>
                <input
                  type="date"
                  value={formData.planned_date}
                  onChange={(e) => setFormData({ ...formData, planned_date: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium"
                />
              </div>

              {/* Recurring Checkbox */}
              <div className="flex items-center gap-3 p-3 bg-purple-50/60 rounded-xl border border-purple-100">
                <input
                  type="checkbox"
                  id="is_recurring"
                  checked={formData.is_recurring}
                  onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-400"
                />
                <label htmlFor="is_recurring" className="text-xs font-bold text-purple-900 cursor-pointer">
                  Khoản chi định kỳ (Lặp lại hàng tháng)
                </label>
              </div>

              {/* Status Selector (Khi chỉnh sửa) */}
              {editingPlan && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Trạng thái</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium"
                  >
                    <option value="PENDING">Chờ thực hiện (PENDING)</option>
                    <option value="COMPLETED">Đã chi / Hoàn thành (COMPLETED)</option>
                    <option value="CANCELLED">Đã hủy (CANCELLED)</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={formSubmitting}
                className="w-full py-3 bg-[#7a4bf6] hover:bg-[#6838eb] text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 mt-2"
              >
                {formSubmitting
                  ? "Đang lưu..."
                  : editingPlan
                  ? "Cập nhật kế hoạch"
                  : "Xác nhận thêm kế hoạch"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useCallback } from "react";
import {
  PieChart as BudgetIcon,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  TrendingDown,
  RotateCw,
  Plus,
  Edit3,
  Calendar,
  X,
  ShieldAlert,
  Sparkles
} from "lucide-react";
import { getBudgetProgress, createBudget, updateBudget, getMyWallet } from "../services/api";

export default function Budgets() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const [loading, setLoading] = useState(true);
  const [budgetData, setBudgetData] = useState(null);
  const [wallet, setWallet] = useState(null);

  // Modal setup / edit limit
  const [showModal, setShowModal] = useState(false);
  const [amountLimit, setAmountLimit] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const formatVND = (val) => {
    return new Intl.NumberFormat("vi-VN").format(Number(val) || 0) + " đ";
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [bData, wData] = await Promise.all([
        getBudgetProgress(selectedMonth, selectedYear).catch(() => null),
        getMyWallet().catch(() => null),
      ]);
      setBudgetData(bData);
      setWallet(wData);
    } catch (err) {
      console.warn("Lỗi khi tải thông tin ngân sách:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenModal = () => {
    setAmountLimit(budgetData?.amount_limit ? budgetData.amount_limit.toString() : "");
    setErrorMsg("");
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amountLimit || parseFloat(amountLimit) <= 0) {
      setErrorMsg("Vui lòng nhập hạn mức lớn hơn 0!");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const limit = parseFloat(amountLimit);
      if (budgetData) {
        // Cập nhật ngân sách đã có
        await updateBudget(selectedMonth, selectedYear, { amount_limit: limit });
      } else {
        // Tạo ngân sách mới cho tháng này
        await createBudget({
          month: selectedMonth,
          year: selectedYear,
          amount_limit: limit,
        });
      }

      setShowModal(false);
      loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Không thể lưu hạn mức ngân sách!");
    } finally {
      setSubmitting(false);
    }
  };

  // Tính số ngày còn lại trong tháng
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const currentDay = currentDate.getDate();
  const daysLeft =
    selectedYear === currentDate.getFullYear() && selectedMonth === currentDate.getMonth() + 1
      ? Math.max(1, daysInMonth - currentDay)
      : daysInMonth;

  const remainingPerDay =
    budgetData && budgetData.remaining_amount > 0 ? Math.round(budgetData.remaining_amount / daysLeft) : 0;

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc]">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200/80 px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <span>Hạn Mức Ngân Sách Tháng</span>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold uppercase tracking-wider border border-purple-200">
              Kiểm Soát Chi Tiêu
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Đặt hạn mức chi tiêu hàng tháng và nhận cảnh báo khi vượt ngưỡng
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Chọn Tháng / Năm */}
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
        </div>
      </header>

      {/* BODY */}
      <div className="p-6 lg:p-8 space-y-6">
        {budgetData ? (
          <>
            {/* THẺ TRẠNG THÁI CẢNH BÁO */}
            <div
              className={`p-5 rounded-3xl border flex items-center justify-between ${
                budgetData.status === "RED_OVERBUDGET"
                  ? "bg-rose-50 border-rose-200 text-rose-800"
                  : budgetData.status === "YELLOW_WARNING"
                  ? "bg-amber-50 border-amber-200 text-amber-800"
                  : "bg-emerald-50 border-emerald-200 text-emerald-800"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl shadow-sm ${
                    budgetData.status === "RED_OVERBUDGET"
                      ? "bg-rose-500 text-white"
                      : budgetData.status === "YELLOW_WARNING"
                      ? "bg-amber-500 text-white"
                      : "bg-emerald-500 text-white"
                  }`}
                >
                  {budgetData.status === "RED_OVERBUDGET" ? (
                    <AlertTriangle className="w-6 h-6" />
                  ) : budgetData.status === "YELLOW_WARNING" ? (
                    <AlertCircle className="w-6 h-6" />
                  ) : (
                    <CheckCircle2 className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm uppercase tracking-wide">
                    {budgetData.status === "RED_OVERBUDGET"
                      ? "Cảnh báo nghiêm trọng: Đã vượt ngân sách!"
                      : budgetData.status === "YELLOW_WARNING"
                      ? "Cảnh báo: Đã sử dụng trên 80% ngân sách!"
                      : "Chi tiêu an toàn trong hạn mức"}
                  </h3>
                  <p className="text-xs opacity-90 mt-0.5">
                    {budgetData.status === "RED_OVERBUDGET"
                      ? `Bạn đã chi tiêu vượt quá ${formatVND(Math.abs(budgetData.remaining_amount))} so với hạn mức đặt ra!`
                      : budgetData.status === "YELLOW_WARNING"
                      ? `Bạn chỉ còn lại ${formatVND(budgetData.remaining_amount)} cho ${daysLeft} ngày tiếp theo của tháng.`
                      : `Tiến độ chi tiêu đang được kiểm soát rất tốt.`}
                  </p>
                </div>
              </div>

              <button
                onClick={handleOpenModal}
                className="px-4 py-2 bg-white rounded-xl text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 border border-slate-200 transition"
              >
                Điều chỉnh hạn mức
              </button>
            </div>

            {/* 3 THẺ KPI TIẾN ĐỘ NGÂN SÁCH */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-sm">
                <span className="text-xs font-medium text-slate-400">Hạn mức ngân sách</span>
                <h3 className="text-2xl font-black text-slate-800 mt-2">
                  {formatVND(budgetData.amount_limit)}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">Đã thiết lập cho tháng {selectedMonth}</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-sm">
                <span className="text-xs font-medium text-slate-400">Tổng tiền đã tiêu</span>
                <h3 className="text-2xl font-black text-rose-600 mt-2">
                  {formatVND(budgetData.total_spent)}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Chiếm {budgetData.percentage_used}% ngân sách
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-sm">
                <span className="text-xs font-medium text-slate-400">Ngân sách còn lại</span>
                <h3
                  className={`text-2xl font-black mt-2 ${
                    budgetData.remaining_amount >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {formatVND(budgetData.remaining_amount)}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  {budgetData.remaining_amount >= 0 ? "Khả dụng cho các ngày tới" : "Đã thâm hụt"}
                </p>
              </div>
            </div>

            {/* THANH TIẾN ĐỘ CHI TIÊU & GỢI Ý CHI TIÊU HÀNG NGÀY */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/70 shadow-sm space-y-6">
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-2">
                  <span className="text-slate-700">Tỷ lệ sử dụng hạn mức</span>
                  <span
                    className={
                      budgetData.percentage_used >= 100
                        ? "text-rose-600 font-black"
                        : budgetData.percentage_used >= 80
                        ? "text-amber-600 font-black"
                        : "text-emerald-600 font-black"
                    }
                  >
                    {budgetData.percentage_used}%
                  </span>
                </div>

                <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      budgetData.percentage_used >= 100
                        ? "bg-rose-500"
                        : budgetData.percentage_used >= 80
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(100, budgetData.percentage_used)}%` }}
                  />
                </div>
              </div>

              {/* Hộp gợi ý kế hoạch */}
              <div className="rounded-2xl p-4 bg-purple-50/60 border border-purple-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    💡
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">
                      Định mức chi tiêu tối đa mỗi ngày
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Số ngày còn lại trong kỳ: <b>{daysLeft} ngày</b>
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-sm font-black text-purple-700">
                    {budgetData.remaining_amount > 0 ? `${formatVND(remainingPerDay)} / ngày` : "0 đ"}
                  </span>
                  <p className="text-[10px] text-slate-400">Để không bị bội chi</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* TRẠNG THÁI CHƯA CÓ NGÂN SÁCH */
          <div className="bg-white p-12 rounded-3xl border border-slate-200/70 text-center max-w-lg mx-auto shadow-sm space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-purple-50 text-purple-600 flex items-center justify-center text-3xl mx-auto shadow-inner">
              🎯
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-800">
                Chưa thiết lập ngân sách cho Tháng {selectedMonth}/{selectedYear}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Thiết lập hạn mức chi tiêu để kiểm soát dòng tiền và tránh tiêu xài quá tay.
              </p>
            </div>

            <button
              onClick={handleOpenModal}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#7a4bf6] hover:bg-[#6838eb] text-white text-xs font-bold rounded-xl shadow-md shadow-purple-500/20 transition active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Thiết lập ngân sách ngay</span>
            </button>
          </div>
        )}
      </div>

      {/* MODAL THIẾT LẬP / ĐIỀU CHỈNH NGÂN SÁCH */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-black text-slate-800">
              {budgetData ? "Điều Chỉnh Ngân Sách" : "Thiết Lập Ngân Sách"}
            </h2>
            <p className="text-xs text-slate-400 mb-5">
              Hạn mức cho <b>Tháng {selectedMonth}/{selectedYear}</b>
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Hạn mức chi tiêu (VND)
                </label>
                <input
                  type="number"
                  required
                  placeholder="Ví dụ: 5000000"
                  value={amountLimit}
                  onChange={(e) => setAmountLimit(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold"
                />
              </div>

              {wallet && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 flex justify-between">
                  <span>Số dư ví hiện có:</span>
                  <span className="font-bold text-purple-700">{formatVND(wallet.balance)}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-[#7a4bf6] hover:bg-[#6838eb] text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 mt-2"
              >
                {submitting ? "Đang lưu..." : "Xác nhận lưu ngân sách"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


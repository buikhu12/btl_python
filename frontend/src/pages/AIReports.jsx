import React, { useState, useEffect } from "react";
import {
  Sparkles,
  TrendingUp,
  Calendar,
  RotateCw,
  PieChart as PieIcon,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight
} from "lucide-react";
import { getMonthlyReport, getAIAnalysis } from "../services/api";

export default function AIReports() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [aiPeriod, setAiPeriod] = useState("month");

  const [loadingReport, setLoadingReport] = useState(true);
  const [loadingAI, setLoadingAI] = useState(false);

  const [reportData, setReportData] = useState(null);
  const [aiData, setAiData] = useState(null);
  const [aiError, setAiError] = useState("");

  const formatVND = (val) => {
    return new Intl.NumberFormat("vi-VN").format(Number(val) || 0) + " đ";
  };

  const loadReport = async () => {
    setLoadingReport(true);
    try {
      const data = await getMonthlyReport(selectedMonth, selectedYear);
      setReportData(data);
    } catch (err) {
      console.warn("Lỗi khi tải báo cáo tháng:", err);
      setReportData(null);
    } finally {
      setLoadingReport(false);
    }
  };

  const runAIAnalysis = async () => {
    setLoadingAI(true);
    setAiError("");
    try {
      const data = await getAIAnalysis(aiPeriod, selectedMonth, selectedYear);
      setAiData(data);
    } catch (err) {
      console.error("Lỗi khi gọi AI phân tích:", err);
      setAiError(err.response?.data?.detail || "Không thể phân tích báo cáo AI lúc này.");
    } finally {
      setLoadingAI(false);
    }
  };

  // Tải báo cáo tháng khi thay đổi tháng/năm
  useEffect(() => {
    loadReport();
  }, [selectedMonth, selectedYear]);

  // Tự động phân tích AI khi vào trang
  useEffect(() => {
    runAIAnalysis();
  }, [aiPeriod, selectedMonth, selectedYear]);

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc]">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200/80 px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <span>Báo Cáo & Cố Vấn AI</span>
            <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 text-[10px] font-bold uppercase tracking-wider">
              Gemini AI
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Báo cáo AI theo {aiPeriod === "month" ? "tháng" : "năm"} đã chọn</p>
        </div>

        {/* BỘ CHỌN THÁNG & NĂM */}
        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
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
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                Năm {y}
              </option>
            ))}
          </select>

          <button
            onClick={loadReport}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
            title="Làm mới"
          >
            <RotateCw className={`w-4 h-4 ${loadingReport ? "animate-spin text-purple-600" : ""}`} />
          </button>
        </div>
      </header>

      {/* BODY */}
      <div className="p-6 lg:p-8 space-y-6">
        {/* SUMMARY CARDS */}
        {reportData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/70 shadow-sm">
              <span className="text-xs font-medium text-slate-400">Tổng thu tháng {selectedMonth}</span>
              <h3 className="text-xl font-black text-emerald-600 mt-1">{formatVND(reportData.total_income)}</h3>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/70 shadow-sm">
              <span className="text-xs font-medium text-slate-400">Tổng chi tháng {selectedMonth}</span>
              <h3 className="text-xl font-black text-rose-600 mt-1">{formatVND(reportData.total_expense)}</h3>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/70 shadow-sm">
              <span className="text-xs font-medium text-slate-400">Tích lũy ròng</span>
              <h3 className={`text-xl font-black mt-1 ${reportData.net_savings >= 0 ? "text-purple-600" : "text-rose-600"}`}>
                {formatVND(reportData.net_savings)}
              </h3>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/70 shadow-sm">
              <span className="text-xs font-medium text-slate-400">Tỷ lệ tiết kiệm</span>
              <h3 className="text-xl font-black text-blue-600 mt-1">{reportData.savings_rate}%</h3>
            </div>
          </div>
        )}

        {/* 50/30/20 RULE & TOP CHI TIÊU */}
        {reportData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quy tắc 50/30/20 */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-sm text-slate-800">Quy tắc phân bổ 50/30/20</h3>
                <span className="text-xs text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded-md">Chuẩn tài chính</span>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-600">Nhu cầu thiết yếu (50%)</span>
                    <span className="text-slate-800 font-bold">{reportData.needs_ratio}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min(100, reportData.needs_ratio)}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-600">Mong muốn cá nhân (30%)</span>
                    <span className="text-slate-800 font-bold">{reportData.wants_ratio}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: `${Math.min(100, reportData.wants_ratio)}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-600">Tiết kiệm & Đầu tư (20%)</span>
                    <span className="text-slate-800 font-bold">{reportData.savings_ratio}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, reportData.savings_ratio))}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Top 3 Chi tiêu nhiều nhất */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-sm">
              <h3 className="font-extrabold text-sm text-slate-800 mb-4">Top 3 Danh mục chi tiêu nhiều nhất</h3>
              <div className="space-y-3">
                {reportData.top_expenses?.length > 0 ? (
                  reportData.top_expenses.map((item, idx) => (
                    <div
                      key={item.category_id || idx}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-800">{item.category_name}</span>
                      </div>
                      <span className="text-xs font-black text-rose-600">{formatVND(item.amount)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 py-6 text-center">Chưa có dữ liệu chi tiêu trong tháng này</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* AI ADVISORY SECTION */}
        <div className="bg-white rounded-3xl border border-purple-200 shadow-sm p-6 lg:p-8 space-y-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800">Cố Vấn Tài Chính Thông Minh AI</h2>
                <p className="text-xs text-slate-400 mt-0.5">Mô hình phân tích thông minh dựa trên dữ liệu thu chi thực tế</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={aiPeriod}
                onChange={(e) => setAiPeriod(e.target.value)}
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                aria-label="Kỳ phân tích AI"
              >
                <option value="month">AI theo tháng</option>
                <option value="year">AI theo năm</option>
              </select>
              <button
                onClick={runAIAnalysis}
                disabled={loadingAI}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-purple-500/20 transition disabled:opacity-60"
              >
                <Zap className={`w-4 h-4 ${loadingAI ? "animate-spin" : ""}`} />
                <span>{loadingAI ? "AI đang phân tích..." : "Phân tích với AI ngay"}</span>
              </button>
            </div>
          </div>

          {/* AI RESULT */}
          {aiError && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {aiError}
            </div>
          )}
          {aiData ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-6 rounded-3xl border bg-white flex flex-col justify-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tổng hợp: {aiData.report?.period}</span>
                  <span className="text-sm font-semibold text-emerald-600">Thu: {formatVND(aiData.report?.total_income)}</span>
                  <span className="text-sm font-semibold text-rose-600">Chi: {formatVND(aiData.report?.total_expense)}</span>
                  <span className="text-sm font-semibold text-slate-700">Số dư thu chi: {formatVND(aiData.report?.balance)}</span>
                  <span className="text-xs text-slate-400">{aiData.report?.transaction_count ?? 0} giao dịch</span>
                </div>

                <div className="md:col-span-2 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span>Phân tích từ Gemini</span>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-600 font-medium whitespace-pre-line">{aiData.analysis}</p>
                </div>
              </div>

              {Object.keys(aiData.report?.expense_by_category ?? {}).length > 0 && (
                <div className="bg-rose-50/60 border border-rose-100 rounded-3xl p-6">
                  <h3 className="text-xs font-bold text-rose-800 mb-3">Chi tiêu theo danh mục</h3>
                  <ul className="space-y-2">
                    {Object.entries(aiData.report.expense_by_category).map(([name, amount]) => (
                      <li key={name} className="flex justify-between gap-4 text-xs text-rose-700">
                        <span>{name}</span><span className="font-semibold">{formatVND(amount)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 p-8 rounded-3xl border border-dashed border-slate-200 text-center text-slate-400 text-xs">
              <Sparkles className="w-8 h-8 mx-auto text-purple-300 mb-2" />
              <p className="font-semibold text-slate-600">Chưa có kết quả phân tích AI</p>
              <p className="mt-1">Nhấn nút <b>"Phân tích với AI ngay"</b> ở trên để nhận lời khuyên tài chính thông minh.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


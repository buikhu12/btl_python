import React, { useState, useEffect, useMemo } from "react";
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
  ChevronRight,
  Copy,
  Check,
  AlertTriangle,
  Target,
  CalendarCheck,
  Wallet,
  DollarSign,
  BarChart3,
  CheckCircle2,
  Clock,
  TrendingDown,
  Info
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
import { getMonthlyReport, getAIAnalysis } from "../services/api";

const PIE_COLORS = [
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#06b6d4", // Cyan
  "#6366f1", // Indigo
  "#f43f5e", // Rose
  "#14b8a6", // Teal
  "#84cc16"  // Lime
];

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
  const [copied, setCopied] = useState(false);

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

  const handleCopyAnalysis = () => {
    if (!aiData?.analysis) return;
    navigator.clipboard.writeText(aiData.analysis);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Tải báo cáo tháng khi thay đổi tháng/năm
  useEffect(() => {
    loadReport();
  }, [selectedMonth, selectedYear]);

  // Tự động phân tích AI khi vào trang hoặc đổi kỳ
  useEffect(() => {
    runAIAnalysis();
  }, [aiPeriod, selectedMonth, selectedYear]);

  // Dữ liệu so sánh 3 cột: Ngân sách vs Dự tính Kế hoạch vs Thực tế đã chi
  const comparisonData = useMemo(() => {
    if (!aiData?.report) return [];
    const bLimit = Number(aiData.report.budget?.amount_limit || 0);
    const pEstimated = Number(aiData.report.planned_expenses?.total_estimated || 0);
    const aSpent = Number(aiData.report.total_expense || 0);

    return [
      {
        name: "Ngân sách",
        amount: bLimit,
        fill: "#8b5cf6",
        desc: aiData.report.budget?.has_budget ? "Hạn mức tối đa" : "Chưa đặt",
      },
      {
        name: "Kế hoạch",
        amount: pEstimated,
        fill: "#3b82f6",
        desc: `${aiData.report.planned_expenses?.total_plans || 0} khoản dự tính`,
      },
      {
        name: "Thực chi",
        amount: aSpent,
        fill: aSpent > bLimit && bLimit > 0 ? "#f43f5e" : "#10b981",
        desc: `${aiData.report.transaction_count || 0} giao dịch`,
      },
    ];
  }, [aiData]);

  // Dữ liệu biểu đồ tròn chi tiêu theo danh mục
  const categoryPieData = useMemo(() => {
    if (!aiData?.report?.expense_by_category) return [];
    return Object.entries(aiData.report.expense_by_category).map(([name, amount]) => ({
      name,
      value: Number(amount),
    }));
  }, [aiData]);

  // Dữ liệu xu hướng thu chi theo tháng (nếu có)
  const monthlyTrendData = useMemo(() => {
    if (!aiData?.report?.monthly) return [];
    return Object.entries(aiData.report.monthly).map(([mKey, val]) => {
      const parts = mKey.split("-");
      const label = parts.length > 1 ? `Tháng ${parseInt(parts[1])}` : mKey;
      return {
        month: mKey,
        label,
        income: Number(val.income || 0),
        expense: Number(val.expense || 0),
      };
    });
  }, [aiData]);

  // Hàm render nội dung phân tích AI thuận mắt người đọc
  const renderFormattedAnalysis = (text) => {
    if (!text) return null;

    const lines = text.split("\n");
    const elements = [];
    let currentList = [];

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="space-y-2 my-2.5 pl-1">
            {currentList.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 shrink-0" />
                <div className="flex-1">{renderInlineFormatting(item)}</div>
              </li>
            ))}
          </ul>
        );
        currentList = [];
      }
    };

    const renderInlineFormatting = (line) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-extrabold text-slate-900">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      if (!trimmed) {
        flushList();
        return;
      }

      // Tiêu đề phần lớn (### hoặc ####)
      if (trimmed.startsWith("### ") || trimmed.startsWith("#### ")) {
        flushList();
        const title = trimmed.replace(/^#+\s*/, "");
        elements.push(
          <div
            key={`header-${index}`}
            className="mt-6 mb-3 pt-4 first:mt-0 first:pt-0 border-t border-slate-200/80 first:border-0"
          >
            <h4 className="text-sm sm:text-base font-black text-slate-800 flex items-center gap-2">
              <span>{renderInlineFormatting(title)}</span>
            </h4>
          </div>
        );
      } else if (trimmed.startsWith("• ") || trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        currentList.push(trimmed.slice(2));
      } else if (/^\d+\.\s/.test(trimmed)) {
        flushList();
        const numMatch = trimmed.match(/^(\d+)\.\s*(.*)/);
        if (numMatch) {
          elements.push(
            <div
              key={`numbered-${index}`}
              className="flex items-start gap-3 my-2.5 p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100 shadow-sm"
            >
              <span className="w-5 h-5 rounded-lg bg-purple-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                {numMatch[1]}
              </span>
              <div className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                {renderInlineFormatting(numMatch[2])}
              </div>
            </div>
          );
        } else {
          elements.push(
            <p key={`p-${index}`} className="text-xs sm:text-sm text-slate-700 my-1 leading-relaxed">
              {renderInlineFormatting(trimmed)}
            </p>
          );
        }
      } else {
        flushList();
        elements.push(
          <p key={`p-${index}`} className="text-xs sm:text-sm text-slate-600 my-2 leading-relaxed font-normal">
            {renderInlineFormatting(trimmed)}
          </p>
        );
      }
    });

    flushList();
    return elements;
  };

  const budget = aiData?.report?.budget;
  const planned = aiData?.report?.planned_expenses;

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc]">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200/80 px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <span>Báo Cáo & Cố Vấn AI</span>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold uppercase tracking-wider border border-purple-200">
              Gemini AI
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Báo cáo tài chính thông minh phân tích toàn diện: Thu chi • Ngân sách • Kế hoạch dự tính
          </p>
        </div>

        {/* BỘ CHỌN THÁNG & NĂM */}
        <div className="flex items-center gap-2">
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
            onClick={() => {
              loadReport();
              runAIAnalysis();
            }}
            className="p-2 text-slate-400 hover:text-purple-600 rounded-xl hover:bg-purple-50 transition"
            title="Làm mới dữ liệu"
          >
            <RotateCw className={`w-4 h-4 ${loadingReport || loadingAI ? "animate-spin text-purple-600" : ""}`} />
          </button>
        </div>
      </header>

      {/* BODY */}
      <div className="p-6 lg:p-8 space-y-6">
        {/* SUMMARY CARDS (GIỮ NGUYÊN) */}
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

        {/* 50/30/20 RULE & TOP CHI TIÊU (GIỮ NGUYÊN) */}
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

        {/* AI ADVISORY SECTION (NÂNG CẤP VỚI BIỂU ĐỒ & DỮ LIỆU NGÂN SÁCH + KẾ HOẠCH) */}
        <div className="bg-white rounded-3xl border border-purple-200 shadow-sm p-6 lg:p-8 space-y-6 relative overflow-hidden">
          {/* Header thanh công cụ AI */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <span>Cố Vấn Tài Chính Thông Minh AI</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Đã tích hợp Ngân sách & Kế hoạch
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Phân tích tự động dựa trên giao dịch thực tế, trần ngân sách và các khoản chi dự kiến
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={aiPeriod}
                onChange={(e) => setAiPeriod(e.target.value)}
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
                aria-label="Kỳ phân tích AI"
              >
                <option value="month">AI theo tháng</option>
                <option value="year">AI theo năm</option>
              </select>

              <button
                onClick={runAIAnalysis}
                disabled={loadingAI}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-purple-500/20 transition disabled:opacity-60 active:scale-95"
              >
                <Zap className={`w-4 h-4 ${loadingAI ? "animate-spin" : ""}`} />
                <span>{loadingAI ? "AI đang phân tích..." : "Phân tích với AI ngay"}</span>
              </button>
            </div>
          </div>

          {/* AI ERROR ALERT */}
          {aiError && (
            <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{aiError}</span>
            </div>
          )}

          {/* AI RESULT */}
          {aiData ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* 1. THẺ THỐNG KÊ NGÂN SÁCH & KẾ HOẠCH DỰ TÍNH (MỚI) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Thẻ Ngân Sách */}
                <div className="p-5 rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-50/50 to-indigo-50/30 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5" />
                        <span>Ngân Sách (Budget)</span>
                      </span>
                      {budget?.status === "OVER_BUDGET" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                          Vượt trần
                        </span>
                      )}
                      {budget?.status === "WARNING" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          Tiệm cận trần
                        </span>
                      )}
                      {budget?.status === "SAFE" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          An toàn
                        </span>
                      )}
                      {budget?.status === "NOT_SET" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          Chưa đặt
                        </span>
                      )}
                    </div>

                    <h4 className="text-lg font-black text-slate-800">
                      {budget?.amount_limit > 0 ? formatVND(budget.amount_limit) : "Chưa cài đặt"}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Đã chi: <strong className="text-rose-600">{formatVND(budget?.total_spent || 0)}</strong> ({budget?.usage_percent || 0}%)
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-purple-100/80">
                    <div className="w-full bg-purple-100/70 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          (budget?.usage_percent || 0) >= 100
                            ? "bg-rose-500"
                            : (budget?.usage_percent || 0) >= 80
                            ? "bg-amber-500"
                            : "bg-purple-600"
                        }`}
                        style={{ width: `${Math.min(100, budget?.usage_percent || 0)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      {budget?.amount_limit > 0
                        ? `Còn lại khả dụng: ${formatVND(budget.remaining)}`
                        : "Khuyên dùng: Đặt ngân sách để AI kiểm soát bội chi"}
                    </span>
                  </div>
                </div>

                {/* Thẻ Kế Hoạch Chi Tiêu */}
                <div className="p-5 rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50/50 to-sky-50/30 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                        <CalendarCheck className="w-3.5 h-3.5" />
                        <span>Kế Hoạch Chi Dự Tính</span>
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        {planned?.total_plans || 0} mục
                      </span>
                    </div>

                    <h4 className="text-lg font-black text-blue-700">
                      {formatVND(planned?.total_estimated || 0)}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Đã chi: <strong className="text-emerald-600">{planned?.completed_count || 0} mục</strong> ({formatVND(planned?.completed_estimated || 0)})
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-blue-100/80">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span>Chờ thực hiện:</span>
                      </span>
                      <strong className="text-amber-600">
                        {planned?.pending_count || 0} mục ({formatVND(planned?.pending_estimated || 0)})
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Thẻ Dòng Tiền & Tích Lũy */}
                <div className="p-5 rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5" />
                        <span>Dòng Tiền {aiData.report?.period}</span>
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                        {aiData.report?.transaction_count || 0} GD
                      </span>
                    </div>

                    <h4 className={`text-lg font-black ${aiData.report?.balance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {formatVND(aiData.report?.balance || 0)}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Thu: <span className="text-emerald-600 font-semibold">{formatVND(aiData.report?.total_income || 0)}</span> • Chi: <span className="text-rose-600 font-semibold">{formatVND(aiData.report?.total_expense || 0)}</span>
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-emerald-100/80">
                    <span className="text-xs font-semibold text-slate-600">
                      Tỷ lệ tiết kiệm thực tế: <strong className="text-purple-600">{aiData.report?.savings_rate ?? 0}%</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. KHU VỰC BIỂU ĐỒ TRỰC QUAN (MỚI THÊM) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Biểu đồ Cột So Sánh: Ngân sách vs Dự tính Kế hoạch vs Thực tế đã chi */}
                <div className="bg-slate-50/80 p-6 rounded-3xl border border-slate-200/80 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-purple-600" />
                        <span>So Sánh Ngân Sách • Kế Hoạch • Thực Chi</span>
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Đánh giá mức độ khớp giữa hạn mức, dự tính và thực tế
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-200">
                      VND
                    </span>
                  </div>

                  <div className="h-64">
                    {comparisonData.some((d) => d.amount > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis
                            dataKey="name"
                            fontSize={11}
                            fontWeight={700}
                            stroke="#64748b"
                            tickLine={false}
                          />
                          <YAxis
                            fontSize={11}
                            stroke="#94a3b8"
                            tickLine={false}
                            tickFormatter={(v) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}tr` : v)}
                          />
                          <Tooltip
                            formatter={(v, name, item) => [formatVND(v), item.payload.desc]}
                            contentStyle={{
                              borderRadius: "16px",
                              border: "1px solid #e2e8f0",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                              fontSize: "12px",
                              fontWeight: 600,
                            }}
                          />
                          <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                            {comparisonData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                        <BarChart3 className="w-8 h-8 text-slate-300 mb-2 stroke-1" />
                        <span>Chưa có dữ liệu so sánh trong kỳ này</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Biểu đồ Tròn: Cơ cấu Chi tiêu theo Danh mục */}
                <div className="bg-slate-50/80 p-6 rounded-3xl border border-slate-200/80 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                        <PieIcon className="w-4 h-4 text-purple-600" />
                        <span>Cơ Cấu Chi Tiêu Theo Danh Mục</span>
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Tỷ trọng phân bổ các nhóm chi tiêu trong kỳ
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-200">
                      Tỷ lệ %
                    </span>
                  </div>

                  <div className="h-64 flex items-center justify-center">
                    {categoryPieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryPieData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={3}
                          >
                            {categoryPieData.map((_, i) => (
                              <Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(v) => [formatVND(v)]}
                            contentStyle={{
                              borderRadius: "16px",
                              border: "1px solid #e2e8f0",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                              fontSize: "12px",
                              fontWeight: 600,
                            }}
                          />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", fontWeight: 600 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                        <PieIcon className="w-8 h-8 text-slate-300 mb-2 stroke-1" />
                        <span>Chưa ghi nhận chi tiêu trong kỳ này</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Biểu đồ Cột Bổ sung: Biến động Thu - Chi nếu xem theo năm hoặc có dữ liệu các tháng */}
              {monthlyTrendData.length > 1 && (
                <div className="bg-slate-50/80 p-6 rounded-3xl border border-slate-200/80 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      <span>Xu Hướng Thu Nhập & Chi Tiêu Theo Tháng</span>
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-200">
                      Kỳ: {aiData.report?.period}
                    </span>
                  </div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyTrendData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="label" fontSize={11} stroke="#64748b" tickLine={false} />
                        <YAxis
                          fontSize={11}
                          stroke="#94a3b8"
                          tickLine={false}
                          tickFormatter={(v) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}tr` : v)}
                        />
                        <Tooltip
                          formatter={(v) => [formatVND(v)]}
                          contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                        <Bar name="Thu nhập" dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} />
                        <Bar name="Chi tiêu" dataKey="expense" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* 3. KHUNG BÁO CÁO CỐ VẤN AI TRÌNH BÀY THUẬN MẮT (FORMATTED AI REPORT) */}
              <div className="bg-gradient-to-b from-white to-slate-50/60 p-6 sm:p-8 rounded-3xl border border-purple-100 shadow-sm relative">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-800">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span>Nội Dung Phân Tích Chuyên Sâu Từ Cố Vấn AI</span>
                  </div>

                  <button
                    onClick={handleCopyAnalysis}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-purple-600 bg-white hover:bg-purple-50 rounded-xl border border-slate-200 transition shadow-sm"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Đã chép!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Sao chép báo cáo</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Trình bày văn bản phân tích theo khối trực quan */}
                <div className="prose prose-slate max-w-none text-slate-700">
                  {renderFormattedAnalysis(aiData.analysis)}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-purple-400" />
                    <span>Báo cáo được tổng hợp tự động từ AI kết hợp Ngân sách và Kế hoạch chi tiêu</span>
                  </span>
                  <span>Đơn vị: VND</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 p-12 rounded-3xl border border-dashed border-slate-200 text-center text-slate-400 text-xs space-y-2">
              <Sparkles className="w-10 h-10 mx-auto text-purple-300" />
              <p className="text-sm font-bold text-slate-700">Chưa có kết quả phân tích AI</p>
              <p className="max-w-md mx-auto text-slate-400">
                Nhấn nút <b>"Phân tích với AI ngay"</b> ở trên để hệ thống đọc toàn bộ giao dịch, ngân sách và kế hoạch chi tiêu rồi đưa ra báo cáo trực quan cho bạn.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

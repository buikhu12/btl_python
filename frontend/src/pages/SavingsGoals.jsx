import React, { useState, useEffect } from "react";
import {
  PiggyBank,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  Trash2,
  Calendar,
  RotateCw,
  X,
  Target,
  CheckCircle,
  Clock,
  Sparkles
} from "lucide-react";
import {
  getSavingsGoals,
  createSavingsGoal,
  deleteSavingsGoal,
  depositSavings,
  withdrawSavings,
  getSavingsHistory
} from "../services/api";

export default function SavingsGoals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal tạo mục tiêu
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    target_amount: "",
    target_date: "",
    description: "",
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Modal nạp / rút tiền
  const [activeGoal, setActiveGoal] = useState(null);
  const [actionType, setActionType] = useState("deposit"); // 'deposit' | 'withdraw'
  const [actionAmount, setActionAmount] = useState("");
  const [actionNote, setActionNote] = useState("");
  const [actionSubmitting, setActionSubmitting] = useState(false);

  // Modal lịch sử
  const [historyGoal, setHistoryGoal] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const formatVND = (val) => {
    return new Intl.NumberFormat("vi-VN").format(Number(val) || 0) + " đ";
  };

  const loadGoals = async () => {
    setLoading(true);
    try {
      const data = await getSavingsGoals();
      setGoals(data || []);
    } catch (err) {
      console.error("Lỗi khi tải mục tiêu tiết kiệm:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.title || !createForm.target_amount) {
      alert("Vui lòng điền tiêu đề và số tiền mục tiêu!");
      return;
    }

    setCreateSubmitting(true);
    try {
      await createSavingsGoal({
        title: createForm.title,
        target_amount: parseFloat(createForm.target_amount),
        target_date: createForm.target_date ? new Date(createForm.target_date).toISOString() : null,
        description: createForm.description || null,
      });

      setShowCreateModal(false);
      setCreateForm({ title: "", target_amount: "", target_date: "", description: "" });
      loadGoals();
    } catch (err) {
      alert(err.response?.data?.detail || "Không thể tạo mục tiêu!");
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa mục tiêu tiết kiệm này?")) return;
    try {
      await deleteSavingsGoal(id);
      loadGoals();
    } catch (err) {
      alert(err.response?.data?.detail || "Không thể xóa mục tiêu!");
    }
  };

  const handleOpenAction = (goal, type) => {
    setActiveGoal(goal);
    setActionType(type);
    setActionAmount("");
    setActionNote("");
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!actionAmount || parseFloat(actionAmount) <= 0) {
      alert("Vui lòng nhập số tiền hợp lệ!");
      return;
    }

    setActionSubmitting(true);
    try {
      const amount = parseFloat(actionAmount);
      if (actionType === "deposit") {
        await depositSavings(activeGoal.id, amount, actionNote);
      } else {
        await withdrawSavings(activeGoal.id, amount, actionNote);
      }

      setActiveGoal(null);
      loadGoals();
    } catch (err) {
      alert(err.response?.data?.detail || "Giao dịch không thành công!");
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleOpenHistory = async (goal) => {
    setHistoryGoal(goal);
    setLoadingHistory(true);
    try {
      const hist = await getSavingsHistory(goal.id);
      setHistoryList(hist || []);
    } catch (err) {
      alert(err.response?.data?.detail || "Không thể tải lịch sử!");
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc]">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200/80 px-8 py-5 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Mục Tiêu Tiết Kiệm</h1>
          <p className="text-xs text-slate-400 mt-0.5">Đặt mục tiêu tài chính, tích lũy từng ngày</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#7a4bf6] hover:bg-[#6838eb] shadow-md shadow-purple-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm mục tiêu mới</span>
          </button>
          <button
            onClick={loadGoals}
            title="Làm mới"
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
          >
            <RotateCw className={`w-4 h-4 ${loading ? "animate-spin text-purple-600" : ""}`} />
          </button>
        </div>
      </header>

      {/* BODY */}
      <div className="p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => {
            const current = Number(goal.current_amount) || 0;
            const target = Number(goal.target_amount) || 1;
            const progress = Math.min(100, Math.round((current / target) * 100));
            const isCompleted = current >= target;

            return (
              <div
                key={goal.id}
                className="bg-white rounded-3xl p-6 border border-slate-200/70 shadow-sm flex flex-col justify-between hover:shadow-md transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg">
                      🎯
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenHistory(goal)}
                        className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                        title="Lịch sử nạp/rút"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(goal.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Xóa mục tiêu"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-extrabold text-base text-slate-800">{goal.title}</h3>
                  {goal.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{goal.description}</p>
                  )}

                  {/* Tiến độ */}
                  <div className="mt-5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Hiện có:</span>
                      <span className="font-extrabold text-slate-800">{formatVND(current)}</span>
                    </div>

                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted
                            ? "bg-emerald-500"
                            : "bg-gradient-to-r from-purple-500 to-indigo-600"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Mục tiêu: {formatVND(target)}</span>
                      <span className={`font-bold ${isCompleted ? "text-emerald-600" : "text-purple-600"}`}>
                        {progress}%
                      </span>
                    </div>
                  </div>

                  {/* Target date */}
                  {goal.target_date && (
                    <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Hạn: {new Date(goal.target_date).toLocaleDateString("vi-VN")}</span>
                    </div>
                  )}
                </div>

                {/* NÚT THAO TÁC */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenAction(goal, "deposit")}
                    className="flex-1 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>Nạp tiền</span>
                  </button>
                  <button
                    onClick={() => handleOpenAction(goal, "withdraw")}
                    className="flex-1 py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Rút tiền</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {goals.length === 0 && !loading && (
          <div className="bg-white p-12 rounded-3xl border border-slate-200/70 text-center text-slate-400 text-xs">
            Chưa có mục tiêu tiết kiệm nào. Hãy tạo mục tiêu như: "Mua laptop", "Quỹ khẩn cấp", "Du lịch"...
          </div>
        )}
      </div>

      {/* MODAL TẠO MỤC TIÊU */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-slate-100 relative">
            <button onClick={() => setShowCreateModal(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-black text-slate-800">Tạo Mục Tiêu Tiết Kiệm</h2>
            <p className="text-xs text-slate-400 mb-5">Xác định mục tiêu và kế hoạch tích lũy</p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Tên mục tiêu</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Mua iPhone mới, Quỹ khẩn cấp..."
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Số tiền mục tiêu (VND)</label>
                <input
                  type="number"
                  required
                  placeholder="Ví dụ: 20000000"
                  value={createForm.target_amount}
                  onChange={(e) => setCreateForm({ ...createForm, target_amount: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Ngày dự kiến hoàn thành</label>
                <input
                  type="date"
                  value={createForm.target_date}
                  onChange={(e) => setCreateForm({ ...createForm, target_date: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Mô tả chi tiết</label>
                <textarea
                  rows="2"
                  placeholder="Mô tả mục tiêu tiết kiệm này..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <button
                type="submit"
                disabled={createSubmitting}
                className="w-full py-3 bg-[#7a4bf6] hover:bg-[#6838eb] text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 mt-2"
              >
                {createSubmitting ? "Đang tạo..." : "Xác nhận tạo mục tiêu"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NẠP / RÚT TIỀN */}
      {activeGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl border border-slate-100 relative">
            <button onClick={() => setActiveGoal(null)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-black text-slate-800">
              {actionType === "deposit" ? "Nạp tiền tiết kiệm" : "Rút tiền tiết kiệm"}
            </h2>
            <p className="text-xs text-slate-400 mb-5">{activeGoal.title}</p>

            <form onSubmit={handleActionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Số tiền (VND)</label>
                <input
                  type="number"
                  required
                  placeholder="Ví dụ: 500000"
                  value={actionAmount}
                  onChange={(e) => setActionAmount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Ghi chú</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Trích từ lương tháng 10"
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <button
                type="submit"
                disabled={actionSubmitting}
                className={`w-full py-3 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 mt-2 ${
                  actionType === "deposit" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {actionSubmitting
                  ? "Đang xử lý..."
                  : actionType === "deposit"
                  ? "Xác nhận nạp tiền"
                  : "Xác nhận rút tiền"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL LỊCH SỬ NẠP / RÚT */}
      {historyGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-slate-100 relative">
            <button onClick={() => setHistoryGoal(null)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-black text-slate-800">Lịch Sử Tích Lũy</h2>
            <p className="text-xs text-slate-400 mb-5">{historyGoal.title}</p>

            <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
              {loadingHistory ? (
                <div className="py-8 text-center text-slate-400 text-xs">Đang tải lịch sử...</div>
              ) : historyList.length > 0 ? (
                historyList.map((item) => {
                  const isDeposit = item.type === "deposit";
                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                            isDeposit ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                          }`}
                        >
                          {isDeposit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{isDeposit ? "Nạp tiền" : "Rút tiền"}</p>
                          <p className="text-[10px] text-slate-400">
                            {item.note || new Date(item.created_at).toLocaleDateString("vi-VN")}
                          </p>
                        </div>
                      </div>
                      <span className={`font-black ${isDeposit ? "text-emerald-600" : "text-rose-600"}`}>
                        {isDeposit ? "+" : "-"}
                        {formatVND(item.amount)}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">Chưa có lịch sử giao dịch</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


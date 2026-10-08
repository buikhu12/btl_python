import React, { useState, useEffect } from "react";
import {
  Wallet as WalletIcon,
  CreditCard,
  Plus,
  Edit2,
  RotateCw,
  X,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  PiggyBank,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { getMyWallet, updateMyWallet, getSavingsGoals } from "../services/api";

export default function Wallets() {
  const [wallet, setWallet] = useState(null);
  const [savingsTotal, setSavingsTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);

  // Form states
  const [walletName, setWalletName] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const formatVND = (val) => {
    return new Intl.NumberFormat("vi-VN").format(Number(val) || 0) + " đ";
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [wData, goalsData] = await Promise.all([
        getMyWallet(),
        getSavingsGoals().catch(() => []),
      ]);

      setWallet(wData);
      setWalletName(wData?.name || "Ví chính");

      const totalSav = (goalsData || []).reduce(
        (sum, g) => sum + (Number(g.current_amount) || 0),
        0
      );
      setSavingsTotal(totalSav);
    } catch (err) {
      console.error("Lỗi khi tải thông tin ví:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Đổi tên ví
  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!walletName.trim()) return;

    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const updated = await updateMyWallet({ name: walletName.trim() });
      setWallet(updated);
      setMessage("Cập nhật tên ví thành công!");
      setTimeout(() => {
        setShowEditModal(false);
        setMessage("");
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.detail || "Không thể cập nhật tên ví!");
    } finally {
      setSubmitting(false);
    }
  };

  // Nạp tiền / Điều chỉnh số dư ví
  const handleDepositBalance = async (e) => {
    e.preventDefault();
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setError("Vui lòng nhập số tiền hợp lệ!");
      return;
    }

    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const currentBal = Number(wallet?.balance) || 0;
      const addAmount = parseFloat(depositAmount);
      const newBal = currentBal + addAmount;

      const updated = await updateMyWallet({ balance: newBal });
      setWallet(updated);
      setMessage(`Đã nạp thành công ${formatVND(addAmount)} vào ví!`);
      setTimeout(() => {
        setShowDepositModal(false);
        setDepositAmount("");
        setMessage("");
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.detail || "Không thể nạp tiền vào ví!");
    } finally {
      setSubmitting(false);
    }
  };

  const totalAssets = (Number(wallet?.balance) || 0) + savingsTotal;

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc]">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200/80 px-8 py-5 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <span>Ví Tiền Của Tôi</span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider border border-blue-200">
              Quản Lý Tài Khoản
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Quản lý số dư thực tế, nạp tiền và theo dõi tổng tài sản
          </p>
        </div>

        <button
          onClick={loadData}
          title="Làm mới"
          className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
        >
          <RotateCw className={`w-4 h-4 ${loading ? "animate-spin text-purple-600" : ""}`} />
        </button>
      </header>

      {/* BODY */}
      <div className="p-6 lg:p-8 space-y-6">
        {/* ROW: THẺ VÍ VÀ TỔNG TÀI SẢN */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* THẺ TÀI CHÍNH (ATM CARD STYLE) */}
          <div className="lg:col-span-1 rounded-3xl p-7 text-white bg-gradient-to-tr from-[#6366f1] via-[#7c3aed] to-[#9333ea] shadow-xl shadow-purple-500/20 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
            {/* Pattern decor */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-indigo-500/30 blur-2xl pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🍋</span>
                <span className="font-extrabold text-xs tracking-wider uppercase opacity-90">
                  Lovely Money Card
                </span>
              </div>
              <button
                onClick={() => {
                  setWalletName(wallet?.name || "Ví chính");
                  setShowEditModal(true);
                }}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition text-white/90"
                title="Đổi tên ví"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="relative z-10 my-6">
              <p className="text-[11px] font-medium text-purple-200">Số dư khả dụng</p>
              <h2 className="text-3xl font-black tracking-tight mt-1">
                {formatVND(wallet?.balance)}
              </h2>
            </div>

            <div className="relative z-10 flex items-center justify-between text-xs font-semibold text-purple-100 pt-3 border-t border-white/15">
              <span>{wallet?.name || "Ví chính"}</span>
              <span className="uppercase font-bold tracking-widest">{wallet?.currency || "VND"}</span>
            </div>
          </div>

          {/* 2 THẺ THỐNG KÊ KÈM NÚT NẠP TIỀN */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Tổng tài sản */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400">Tổng tài sản ròng</span>
                <h3 className="text-2xl font-black text-slate-800 mt-1">
                  {formatVND(totalAssets)}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Bao gồm số dư ví và quỹ tích lũy
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Trong ví tiền:</span>
                <span className="font-bold text-purple-700">{formatVND(wallet?.balance)}</span>
              </div>
            </div>

            {/* Quỹ tích lũy */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400">Đã tích lũy mục tiêu</span>
                <h3 className="text-2xl font-black text-emerald-600 mt-1">
                  {formatVND(savingsTotal)}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Trong các mục tiêu tiết kiệm
                </p>
              </div>

              <button
                onClick={() => setShowDepositModal(true)}
                className="w-full mt-4 py-2.5 px-4 bg-[#7a4bf6] hover:bg-[#6838eb] text-white text-xs font-bold rounded-xl shadow-md shadow-purple-500/20 transition flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Nạp tiền vào ví</span>
              </button>
            </div>
          </div>
        </div>

        {/* THÔNG TIN CHI TIẾT VÀ TÍNH NĂNG TÍCH HỢP VÍ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-sm text-slate-800">Tự động cộng tiền khi Thu nhập</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Mỗi khi bạn ghi chép một khoản thu nhập mới, số dư trong ví sẽ tự động được cộng thêm ngay tức thì.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-sm text-slate-800">Tự động trừ tiền khi Chi tiêu</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Mỗi khoản chi tiêu hàng ngày sẽ được khấu trừ trực tiếp từ số dư ví để đảm bảo số liệu thực tế luôn khớp.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-sm text-slate-800">Bảo mật & Phân lập dữ liệu</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ví tiền được gắn riêng biệt với từng tài khoản và mã hóa an toàn, đảm bảo tính riêng tư tuyệt đối.
            </p>
          </div>
        </div>
      </div>

      {/* MODAL ĐỔI TÊN VÍ */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-black text-slate-800">Đổi Tên Ví</h2>
            <p className="text-xs text-slate-400 mb-5">Đặt tên gợi nhớ cho ví tài chính của bạn</p>

            {message && (
              <div className="mb-4 p-3 rounded-2xl bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-50 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleUpdateName} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Tên ví mới</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Ví Tiêu Dùng, Tài Khoản Techcombank..."
                  value={walletName}
                  onChange={(e) => setWalletName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-[#7a4bf6] hover:bg-[#6838eb] text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 mt-2"
              >
                {submitting ? "Đang lưu..." : "Xác nhận lưu tên ví"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NẠP TIỀN VÀO VÍ */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowDepositModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-black text-slate-800">Nạp Tiền Vào Ví</h2>
            <p className="text-xs text-slate-400 mb-5">Tăng số dư khả dụng cho ví của bạn</p>

            {message && (
              <div className="mb-4 p-3 rounded-2xl bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-50 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleDepositBalance} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Số tiền nạp (VND)
                </label>
                <input
                  type="number"
                  required
                  placeholder="Ví dụ: 1000000"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 flex justify-between">
                <span>Số dư hiện tại:</span>
                <span className="font-bold text-slate-700">{formatVND(wallet?.balance)}</span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-[#7a4bf6] hover:bg-[#6838eb] text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 mt-2"
              >
                {submitting ? "Đang xử lý..." : "Xác nhận nạp tiền"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


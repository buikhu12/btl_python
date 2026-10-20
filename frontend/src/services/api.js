import axios from "axios";

export const API_BASE_URL = "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to catch unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("access_token");
      if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// --- AUTH & USER APIS ---
export const login = async (email, password) => {
  const res = await api.post("/auth/login", { email, password });
  if (res.data?.access_token) {
    localStorage.setItem("access_token", res.data.access_token);
  }
  return res.data;
};

export const register = async (username, email, password) => {
  const res = await api.post("/users/", { username, email, password });
  return res.data;
};

export const getMe = async () => {
  const res = await api.get("/users/me");
  return res.data;
};

export const updateMe = async (username, email, password = null) => {
  const payload = {};
  if (username) payload.username = username;
  if (email) payload.email = email;
  if (password) payload.password = password;
  const res = await api.patch("/users/me", payload);
  return res.data;
};

export const deleteMe = async () => {
  const res = await api.delete("/users/me");
  localStorage.removeItem("access_token");
  return res.data;
};

// --- DASHBOARD APIS ---
export const getDashboardSummary = async () => {
  const res = await api.get("/dashboard/summary");
  return res.data;
};

export const getCategoryExpenses = async () => {
  const res = await api.get("/dashboard/category-expenses");
  return res.data;
};

export const getMonthlySummary = async () => {
  const res = await api.get("/dashboard/monthly");
  return res.data;
};

export const getRecentTransactions = async () => {
  const res = await api.get("/dashboard/recent-transactions");
  return res.data;
};

// --- TRANSACTIONS APIS ---
// Hàm sinh idempotency_key duy nhất (UUID) cho mỗi lần người dùng bắt đầu tạo giao dịch
export const generateIdempotencyKey = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "idemp-" + Date.now() + "-" + Math.random().toString(36).substring(2, 11);
};

export const getTransactions = async (params = {}) => {
  const res = await api.get("/transactions/", { params });
  return res.data;
};

// API tạo giao dịch: đính kèm idempotency_key duy nhất trong payload và header
// Giữ nguyên key đó khi retry để backend nhận diện và không cộng/trừ ví lần nữa
export const createTransaction = async (data, customKey = null, config = {}) => {
  const key = customKey || data.idempotency_key || generateIdempotencyKey();
  const payload = {
    ...data,
    idempotency_key: key,
  };
  const reqConfig = {
    ...config,
    headers: {
      ...(config.headers || {}),
      "Idempotency-Key": key,
    },
  };
  const res = await api.post("/transactions/", payload, reqConfig);
  return res.data;
};

// API tra cứu trạng thái giao dịch theo idempotency_key (Backend trả về giao dịch và số dư ví hiện tại)
export const getTransactionByIdempotencyKey = async (key) => {
  const res = await api.get(`/transactions/idempotency/${key}`);
  return res.data;
};

export const updateTransaction = async (id, data) => {
  const res = await api.patch(`/transactions/${id}`, data);
  return res.data;
};

export const deleteTransaction = async (id) => {
  const res = await api.delete(`/transactions/${id}`);
  return res.data;
};

// --- CATEGORIES APIS ---
export const DEFAULT_CATEGORIES = [
  { name: "Ăn uống", type: "expense" },
  { name: "Mua sắm", type: "expense" },
  { name: "Di chuyển", type: "expense" },
  { name: "Hóa đơn & Tiện ích", type: "expense" },
  { name: "Giải trí", type: "expense" },
  { name: "Sức khỏe", type: "expense" },
  { name: "Tiền lương", type: "income" },
  { name: "Tiền thưởng", type: "income" },
  { name: "Thu nhập phụ", type: "income" },
  { name: "Đầu tư", type: "income" },
];

let isSeedingCategories = false;

export const seedDefaultCategories = async () => {
  try {
    const res = await api.get("/categories/");
    const existing = res.data || [];
    const existingKeys = new Set(existing.map((c) => `${c.name.trim().toLowerCase()}_${c.type}`));

    const toCreate = DEFAULT_CATEGORIES.filter(
      (c) => !existingKeys.has(`${c.name.trim().toLowerCase()}_${c.type}`)
    );

    for (const cat of toCreate) {
      try {
        await api.post("/categories/", cat);
      } catch (e) {
        // ignore if already exists
      }
    }

    const refreshed = await api.get("/categories/");
    window.dispatchEvent(new Event("categories-updated"));
    return refreshed.data || [];
  } catch (err) {
    console.error("Lỗi khi khởi tạo danh mục mẫu:", err);
    return [];
  }
};

export const getCategories = async (type = null) => {
  const params = type ? { type } : {};
  const res = await api.get("/categories/", { params });
  let list = res.data || [];

  // Nếu người dùng chưa có bất kỳ danh mục nào, tự động seed danh mục chuẩn
  if (list.length === 0 && !isSeedingCategories) {
    isSeedingCategories = true;
    try {
      const seeded = await seedDefaultCategories();
      list = type ? seeded.filter((c) => c.type === type) : seeded;
    } catch (e) {
      console.warn("Không thể auto-seed danh mục:", e);
    } finally {
      isSeedingCategories = false;
    }
  }

  return list;
};

export const createCategory = async (data) => {
  const res = await api.post("/categories/", data);
  return res.data;
};

export const updateCategory = async (id, data) => {
  const res = await api.patch(`/categories/${id}`, data);
  return res.data;
};

export const deleteCategory = async (id) => {
  const res = await api.delete(`/categories/${id}`);
  return res.data;
};

// --- SAVINGS GOALS APIS ---
export const getSavingsGoals = async () => {
  const res = await api.get("/savings-goals/");
  return res.data;
};

export const getSavingsGoalDetail = async (id) => {
  const res = await api.get(`/savings-goals/${id}`);
  return res.data;
};

export const createSavingsGoal = async (data) => {
  const res = await api.post("/savings-goals/", data);
  return res.data;
};

export const updateSavingsGoal = async (id, data) => {
  const res = await api.put(`/savings-goals/${id}`, data);
  return res.data;
};

export const deleteSavingsGoal = async (id) => {
  const res = await api.delete(`/savings-goals/${id}`);
  return res.data;
};

export const depositSavings = async (id, amount, note = "") => {
  const res = await api.post(`/savings-goals/${id}/deposit`, { amount, note });
  return res.data;
};

export const withdrawSavings = async (id, amount, note = "") => {
  const res = await api.post(`/savings-goals/${id}/withdraw`, { amount, note });
  return res.data;
};

export const getSavingsHistory = async (id) => {
  const res = await api.get(`/savings-goals/${id}/history`);
  return res.data;
};

// --- REPORTS & AI APIS ---
export const getMonthlyReport = async (month, year) => {
  const params = {};
  if (month) params.month = month;
  if (year) params.year = year;
  const res = await api.get("/reports/monthly", { params });
  return res.data;
};

export const getAIAnalysis = async (period, month, year) => {
  const res = await api.post("/ai/analyze-report", null, {
    params: { period, month, year },
  });
  return res.data;
};

export const analyzeFinancialReport = getAIAnalysis;

// --- WALLETS APIS ---
export const getMyWallet = async () => {
  const res = await api.get("/wallets/me");
  return res.data;
};

export const updateMyWallet = async (data) => {
  const res = await api.patch("/wallets/me", data);
  return res.data;
};

// --- BUDGETS APIS ---
export const getBudgetProgress = async (month, year) => {
  const res = await api.get("/budgets/progress", {
    params: { month, year },
  });
  return res.data;
};

export const createBudget = async (data) => {
  const res = await api.post("/budgets/", data);
  return res.data;
};

export const updateBudget = async (month, year, data) => {
  const res = await api.patch("/budgets/", data, {
    params: { month, year },
  });
  return res.data;
};

// --- PLANNED EXPENSES APIS ---
export const getPlannedExpenses = async (month, year) => {
  const res = await api.get("/planned-expenses/", {
    params: { month, year },
  });
  return res.data;
};

export const createPlannedExpense = async (data) => {
  const res = await api.post("/planned-expenses/", data);
  return res.data;
};

export const updatePlannedExpense = async (planId, data) => {
  const res = await api.patch(`/planned-expenses/${planId}`, data);
  return res.data;
};

export const deletePlannedExpense = async (planId) => {
  const res = await api.delete(`/planned-expenses/${planId}`);
  return res.data;
};

// --- ADMIN APIS ---
export const getAdminUsers = async () => {
  const res = await api.get("/admin/users");
  return res.data;
};

export const resetUserPassword = async (userId, newPassword) => {
  const res = await api.put(`/admin/users/${userId}/password`, {
    new_password: newPassword,
  });
  return res.data;
};

export default api;

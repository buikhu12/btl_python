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
export const getTransactions = async (params = {}) => {
  const res = await api.get("/transactions/", { params });
  return res.data;
};

export const createTransaction = async (data) => {
  const res = await api.post("/transactions/", data);
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
export const getCategories = async (type = null) => {
  const params = type ? { type } : {};
  const res = await api.get("/categories/", { params });
  return res.data;
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

export const getAIAnalysis = async (month, year) => {
  const params = {};
  if (month) params.month = month;
  if (year) params.year = year;
  const res = await api.get("/ai/financial-analysis", { params });
  return res.data;
};

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
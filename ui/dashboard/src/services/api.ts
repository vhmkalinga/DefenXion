import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";


// ======================================================
// AXIOS INSTANCE
// ======================================================
const api: AxiosInstance = axios.create({
  baseURL: "http://localhost:8000",
  withCredentials: false,
});


// ======================================================
// REQUEST INTERCEPTOR (Attach Access Token)
// ======================================================
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("access_token");

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);


// ======================================================
// REFRESH TOKEN LOGIC
// ======================================================
let isRefreshing = false;

let failedQueue: {
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
}[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};


// ======================================================
// RESPONSE INTERCEPTOR (Auto Refresh)
// ======================================================
api.interceptors.response.use(
  (response: AxiosResponse) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Only handle 401 errors
    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refresh_token");

      if (!refreshToken) {
        localStorage.clear();
        window.location.href = "/";
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(
          "http://localhost:8000/auth/refresh",
          { refresh_token: refreshToken }
        );

        const newAccessToken = response.data.access_token;

        // Store new access token
        localStorage.setItem("access_token", newAccessToken);

        // Update default headers
        api.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${newAccessToken}`;

        // Update original request header
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        processQueue(null, newAccessToken);

        return api(originalRequest);

      } catch (refreshError) {
        processQueue(refreshError, null);

        localStorage.clear();
        window.location.href = "/";

        return Promise.reject(refreshError);

      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const getDashboardStats = async () => {
  const response = await api.get("/dashboard/stats");
  return response.data;
};

export const getRecentAlerts = async () => {
  const response = await api.get("/dashboard/recent-alerts");
  return response.data;
};

export const triggerSimulatedPrediction = async (data: any) => {
  const response = await api.post("/predict", data);
  return response.data;
};

export const getDashboardTraffic = async () => {
  const response = await api.get("/dashboard/analytics/traffic");
  return response.data;
};

export const getAllThreats = async (page = 1, limit = 20) => {
  const response = await api.get(`/dashboard/threats?page=${page}&limit=${limit}`);
  return response.data;
};

export const getModelStats = async () => {
  const response = await api.get("/dashboard/model-stats");
  return response.data;
};

export const trainNewModel = async (params?: { algorithm?: string; n_estimators?: number; max_depth?: number | null; sample_size?: number }) => {
  const response = await api.post("/train", params || {});
  return response.data;
};

export const getDeployedModels = async () => {
  const response = await api.get("/models");
  return response.data;
};

export const activateModel = async (version: string) => {
  const response = await api.put(`/models/${version}/activate`);
  return response.data;
};

export const deleteModel = async (version: string) => {
  const response = await api.delete(`/models/${version}`);
  return response.data;
};

export const getModelDetails = async (version: string) => {
  const response = await api.get(`/models/${version}`);
  return response.data;
};

export const getActiveResponses = async () => {
  const response = await api.get("/dashboard/responses");
  return response.data;
};

// ── Defense Modules ──
export const getDefenseModules = async () => {
  const response = await api.get("/defense/modules");
  return response.data;
};

export const toggleDefenseModule = async (name: string) => {
  const response = await api.put(`/defense/modules/${encodeURIComponent(name)}/toggle`);
  return response.data;
};

// ── Defense Settings ──
export const getDefenseSettings = async () => {
  const response = await api.get("/defense/settings");
  return response.data;
};

export const updateDefenseSettings = async (settings: { sensitivity?: number; block_duration_hours?: number }) => {
  const response = await api.put("/defense/settings", settings);
  return response.data;
};

// ── Firewall Rules ──
export const getFirewallRules = async () => {
  const response = await api.get("/defense/firewall-rules");
  return response.data;
};

export const createFirewallRule = async (rule: { name: string; priority?: string; action?: string }) => {
  const response = await api.post("/defense/firewall-rules", rule);
  return response.data;
};

export const updateFirewallRule = async (ruleId: number, updates: { name?: string; priority?: string; status?: string; action?: string }) => {
  const response = await api.put(`/defense/firewall-rules/${ruleId}`, updates);
  return response.data;
};

export const deleteFirewallRule = async (ruleId: number) => {
  const response = await api.delete(`/defense/firewall-rules/${ruleId}`);
  return response.data;
};

export const getSystemLogs = async (page = 1, limit = 50, level?: string, source?: string, search?: string) => {
  let url = `/logs?page=${page}&limit=${limit}`;
  if (level && level !== 'all-levels') url += `&level=${level}`;
  if (source && source !== 'all-sources') url += `&source=${source}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  const response = await api.get(url);
  return response.data;
};

// ── Reports ──
export const getReports = async () => {
  const response = await api.get("/reports");
  return response.data;
};

export const generateReport = async (period: string = 'daily') => {
  const response = await api.post(`/reports/generate?period=${period}`);
  return response.data;
};

export const getReportDetail = async (reportId: string) => {
  const response = await api.get(`/reports/${reportId}`);
  return response.data;
};

export const deleteReport = async (reportId: string) => {
  const response = await api.delete(`/reports/${reportId}`);
  return response.data;
};

// ── App Settings ──
export const getAppSettings = async () => {
  const response = await api.get("/settings/app");
  return response.data;
};

export const updateAppSettings = async (settings: Record<string, any>) => {
  const response = await api.put("/settings/app", settings);
  return response.data;
};

export const changePassword = async (currentPassword: string, newPassword: string) => {
  const response = await api.post("/settings/change-password", {
    current_password: currentPassword,
    new_password: newPassword,
  });
  return response.data;
};

export const getSystemInfo = async () => {
  const response = await api.get("/settings/system-info");
  return response.data;
};

// ── User Management ──
export const listUsers = async () => {
  const response = await api.get("/users");
  return response.data;
};

export const createUser = async (username: string, email: string, password: string, role: string) => {
  const response = await api.post("/users/create", { username, email, password, role });
  return response.data;
};

export const deleteUser = async (username: string) => {
  const response = await api.delete(`/users/${username}`);
  return response.data;
};

export default api;

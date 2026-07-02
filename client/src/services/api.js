import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000",
});

// Attach Clerk session token automatically if available
api.interceptors.request.use(
  async (config) => {
    // Prefer localStorage token (set by old auth flow)
    let token = localStorage.getItem("token");
    
    // Fallback to Clerk token if available
    if (window.Clerk && window.Clerk.session) {
      try {
        token = await window.Clerk.session.getToken();
      } catch (e) {
        console.warn("Failed to get Clerk token", e);
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;

import axios from "axios";

// Use Vite environment variable or fallback to localhost
const adminApi = axios.create({
  baseURL: import.meta.env.VITE_ADMIN_API_URL || "http://localhost:5000/api/admin",
});

export default adminApi;

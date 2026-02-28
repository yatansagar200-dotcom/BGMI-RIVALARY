import axios from "axios";

const adminApi = axios.create({
  baseURL: process.env.REACT_APP_ADMIN_API_URL,
});

export default adminApi;
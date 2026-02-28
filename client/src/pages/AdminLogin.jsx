import { useState } from "react";
import adminApi from "../api/admin";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await adminApi.post("/login", { 
        email: email.trim(), 
        password: password.trim() 
      });

      if (res.data.success) {
        alert("Login Successful 🔥");
        navigate("/admin/dashboard");
      } else {
        setError(res.data.message || "Invalid Admin Credentials 😤");
        alert(res.data.message || "Invalid Admin Credentials 😤");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Connection error - ensure server is running";
      setError(errorMsg);
      console.error("Login Error:", err);
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex justify-center items-center">
      <form
        onSubmit={handleSubmit}
        className="bg-[#020617] p-8 rounded-xl w-full max-w-md text-white"
      >
        <h2 className="text-2xl font-bold text-yellow-400 mb-6 text-center">
          Admin Login
        </h2>

        {error && <div className="mb-4 p-3 bg-red-900 text-red-300 rounded">{error}</div>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input mb-4"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input mb-4"
          required
        />

        <button 
          className="w-full bg-red-600 hover:bg-red-700 py-2 rounded-lg font-semibold disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}

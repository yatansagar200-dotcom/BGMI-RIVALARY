import { useState } from "react"
import { Link } from "react-router-dom"
import api from "../api/axios"

export default function Register() {
  const [form, setForm] = useState({
    playerName: "",
    phone: "",
    email: "",
    password: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await api.post("/contestants/register", form)
      
      if (res.data.success) {
        localStorage.setItem("contestantId", res.data.data._id)
        localStorage.setItem("playerName", res.data.data.playerName)
        localStorage.setItem("phone", res.data.data.phone)
        localStorage.setItem("email", res.data.data.email)
        
        setSuccess(true)
        alert("Registration Successful 🔥\nYou can now join tournaments!")
        setForm({
          playerName: "",
          phone: "",
          email: "",
          password: "",
        })
        
        setTimeout(() => {
          window.location.href = "/"
        }, 1000)
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Connection error - ensure server is running"
      setError(errorMsg)
      console.error("Registration Error:", err)
      alert(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex justify-center items-center px-4 text-white py-8">
      <form
        onSubmit={handleSubmit}
        className="bg-[#020617] p-8 rounded-xl w-full max-w-md"
      >
        <h2 className="text-2xl font-bold text-yellow-400 mb-6 text-center">
          Tournament Registration
        </h2>

        {error && <div className="mb-4 p-3 bg-red-900 text-red-300 rounded text-sm">{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-900 text-green-300 rounded text-sm">Registration successful! Redirecting...</div>}

        <input
          name="playerName"
          placeholder="Player Name"
          className="input"
          value={form.playerName}
          onChange={handleChange}
          required
        />

        <input
          name="phone"
          placeholder="Mobile Number"
          type="tel"
          className="input"
          value={form.phone}
          onChange={handleChange}
          required
        />

        <input
          name="email"
          placeholder="Email ID"
          type="email"
          className="input"
          value={form.email}
          onChange={handleChange}
          required
        />

        <input
          name="password"
          placeholder="Password"
          type="password"
          className="input"
          value={form.password}
          onChange={handleChange}
          required
        />

        <button 
          className="w-full bg-green-600 hover:bg-green-700 py-2 rounded-lg font-semibold mt-4 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Registering..." : "Register Now"}
        </button>

        <p className="text-xs text-gray-400 mt-4 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-yellow-400 hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  )
}

import { useState, useEffect } from "react"
import api from "../api/axios"
import { useNavigate } from "react-router-dom"

export default function Profile() {
  const [contestant, setContestant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  const navigate = useNavigate()

  const [form, setForm] = useState({
    playerName: "",
    bio: "",
    bgmiId: "",
    avatar: ""
  })

  useEffect(() => {
    const contestantId = localStorage.getItem("contestantId")
    if (!contestantId) {
      navigate("/register")
      return
    }
    fetchProfile(contestantId)
  }, [navigate])

  const fetchProfile = async (id) => {
    try {
      setLoading(true)
      const res = await api.get(`/contestants/profile/${id}`)
      if (res.data.success) {
        setContestant(res.data.data)
        setForm({
          playerName: res.data.data.playerName || "",
          bio: res.data.data.bio || "",
          bgmiId: res.data.data.bgmiId || "",
          avatar: res.data.data.avatar || ""
        })
      }
    } catch (err) {
      console.error("Error fetching profile:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ type: "", text: "" })

    try {
      const contestantId = localStorage.getItem("contestantId")
      const res = await api.put(`/contestants/profile/${contestantId}`, form)
      if (res.data.success) {
        setMessage({ type: "success", text: "Profile updated successfully! 🔥" })
        setContestant(res.data.data)
      }
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Error updating profile" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading profile...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-yellow-400">My Profile</h1>
          <button
            onClick={() => navigate("/")}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
          >
            Back
          </button>
        </div>

        {/* Profile Stats Card */}
        <div className="bg-[#020617] rounded-xl p-6 mb-6 border border-gray-700">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 rounded-full bg-yellow-500 flex items-center justify-center text-black text-3xl font-bold">
              {contestant?.playerName?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{contestant?.playerName}</h2>
              <p className="text-gray-400">{contestant?.email}</p>
              <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs ${
                contestant?.status === "active" ? "bg-green-600" : "bg-red-600"
              }`}>
                {contestant?.status || "active"}
              </span>
            </div>
          </div>

          {/* BGMI Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-black p-3 rounded-lg text-center">
              <p className="text-gray-400 text-xs">Total Matches</p>
              <p className="text-white font-bold">{contestant?.totalMatches || 0}</p>
            </div>
            <div className="bg-black p-3 rounded-lg text-center">
              <p className="text-gray-400 text-xs">Total Kills</p>
              <p className="text-white font-bold">{contestant?.totalKills || 0}</p>
            </div>
            <div className="bg-black p-3 rounded-lg text-center">
              <p className="text-gray-400 text-xs">Total Wins</p>
              <p className="text-green-400 font-bold">{contestant?.totalWins || 0}</p>
            </div>
          </div>

          {/* Wallet Quick View */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-400 text-sm">Wallet Balance</p>
                <p className="text-2xl font-bold text-green-400">₹{contestant?.walletBalance || 0}</p>
              </div>
              <button
                onClick={() => navigate("/wallet")}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                View Wallet
              </button>
            </div>
          </div>
        </div>

        {/* Edit Profile Form */}
        <div className="bg-[#020617] rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Edit Profile</h3>
          
          {message.text && (
            <div className={`mb-4 p-3 rounded ${message.type === "success" ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Player Name</label>
              <input
                type="text"
                name="playerName"
                value={form.playerName}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-1">BGMI ID</label>
              <input
                type="text"
                name="bgmiId"
                value={form.bgmiId}
                onChange={handleChange}
                placeholder="Enter your BGMI ID"
                className="input"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-1">Bio</label>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself..."
                className="input"
                rows="3"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-1">Profile Image</label>
              <div className="flex items-center gap-4">
                {form.avatar && (
                  <img 
                    src={form.avatar} 
                    alt="Profile" 
                    className="w-16 h-16 rounded-full object-cover border-2 border-yellow-500"
                  />
                )}
                <input
                  type="text"
                  name="avatar"
                  value={form.avatar}
                  onChange={handleChange}
                  placeholder="Enter image URL or upload"
                  className="input flex-1"
                />
              </div>
              <p className="text-gray-500 text-xs mt-1">Paste an image URL above</p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black py-2 rounded-lg font-semibold disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

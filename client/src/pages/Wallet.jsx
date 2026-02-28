import { useState, useEffect, useRef } from "react"
import api from "../api/axios"
import adminApi from "../api/admin"
import { useNavigate } from "react-router-dom"
import qrCodeImage from "../assets/qr code.jpeg"

export default function Wallet() {
  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("deposit")
  const [amount, setAmount] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [screenshotUrl, setScreenshotUrl] = useState("")
  const [screenshotPreview, setScreenshotPreview] = useState("")
  const fileInputRef = useRef(null)
  const navigate = useNavigate()

  const UPI_ID = "7668261126@ybl"
  const MIN_DEPOSIT = 10
  const MIN_WITHDRAWAL = 50
  const ADMIN_WHATSAPP = "917668261126" // Admin WhatsApp number

  useEffect(() => {
    const contestantId = localStorage.getItem("contestantId")
    if (!contestantId) {
      navigate("/register")
      return
    }
    fetchWallet(contestantId)
    fetchTransactions(contestantId)
  }, [navigate])

  const fetchWallet = async (id) => {
    try {
      const res = await api.get(`/contestants/wallet/${id}`)
      if (res.data.success) {
        setWallet(res.data.data)
      }
    } catch (err) {
      console.error("Error fetching wallet:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactions = async (id) => {
    try {
      const res = await adminApi.get(`/transactions/${id}`)
      if (res.data.success) {
        setTransactions(res.data.data)
      }
    } catch (err) {
      console.error("Error fetching transactions:", err)
    }
  }

  const showPendingMessage = (type) => {
    const msg = `Your ${type} request has been submitted! ⏳\n\nOur team will verify and process your request within 30 minutes or less.\n\nYou'll receive a notification once it's approved.`
    alert(msg)
  }

  const handleDeposit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage({ type: "", text: "" })

    const depositAmount = Number(amount)
    if (isNaN(depositAmount) || depositAmount < MIN_DEPOSIT) {
      setMessage({ type: "error", text: `Minimum deposit is ₹${MIN_DEPOSIT}` })
      setSubmitting(false)
      return
    }

    if (!screenshotUrl && !screenshotPreview) {
      setMessage({ type: "error", text: "Please select payment screenshot first" })
      setSubmitting(false)
      return
    }

    try {
      const contestantId = localStorage.getItem("contestantId")
      
      const screenshotToSend = screenshotUrl || screenshotPreview
      
      console.log("Submitting deposit:", {
        contestantId,
        amount: depositAmount,
        paymentScreenshot: screenshotToSend
      })
      
      const res = await adminApi.post("/deposits", {
        contestantId,
        amount: depositAmount,
        paymentScreenshot: screenshotToSend,
        transactionId: `DEP_${Date.now()}`
      })

      if (res.data.success) {
        setMessage({ type: "success", text: "Deposit request submitted! Wait for admin approval." })
        setAmount("")
        setScreenshotUrl("")
        setScreenshotPreview("")
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
        fetchTransactions(contestantId)
        
        // Show pending message
        showPendingMessage("deposit")
      }
    } catch (err) {
      console.error("Deposit error:", err)
      setMessage({ type: "error", text: err.response?.data?.message || "Error submitting deposit request" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleWithdraw = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage({ type: "", text: "" })

    const withdrawAmount = Number(amount)
    if (isNaN(withdrawAmount) || withdrawAmount < MIN_WITHDRAWAL) {
      setMessage({ type: "error", text: `Minimum withdrawal is ₹${MIN_WITHDRAWAL}` })
      setSubmitting(false)
      return
    }

    if (withdrawAmount > (wallet?.walletBalance || 0)) {
      setMessage({ type: "error", text: "Insufficient balance" })
      setSubmitting(false)
      return
    }

    try {
      const contestantId = localStorage.getItem("contestantId")
      const res = await adminApi.post("/withdrawals", {
        contestantId,
        amount: withdrawAmount,
        upiId: UPI_ID
      })

      if (res.data.success) {
        setMessage({ type: "success", text: "Withdrawal request submitted! Wait for admin approval." })
        setAmount("")
        fetchWallet(contestantId)
        fetchTransactions(contestantId)
        
        // Show pending message
        showPendingMessage("withdrawal")
      }
    } catch (err) {
      console.error("Withdrawal error:", err)
      setMessage({ type: "error", text: err.response?.data?.message || "Error submitting withdrawal" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleScreenshotChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "File size must be less than 5MB" })
      return
    }
    
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please select an image file" })
      return
    }
    
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64Data = reader.result
      setScreenshotPreview(base64Data)
      setScreenshotUrl(base64Data)
      setMessage({ type: "success", text: "Screenshot selected!" })
    }
    reader.readAsDataURL(file)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading wallet...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-yellow-400">My Wallet</h1>
          <button
            onClick={() => navigate("/")}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
          >
            Back
          </button>
        </div>

        {/* Info Message */}
        <div className="bg-blue-900/30 border border-blue-700 p-3 rounded-lg mb-4">
          <p className="text-blue-300 text-sm text-center">
            ⏳ All requests are processed within 30 minutes or less
          </p>
        </div>

        {/* Wallet Balance Card */}
        <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-xl p-6 mb-6">
          <p className="text-yellow-100 text-sm">Available Balance</p>
          <p className="text-4xl font-bold text-white">₹{wallet?.walletBalance || 0}</p>
          
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-black/30 p-3 rounded-lg text-center">
              <p className="text-yellow-100 text-xs">Deposited</p>
              <p className="text-white font-bold">₹{wallet?.totalDeposited || 0}</p>
            </div>
            <div className="bg-black/30 p-3 rounded-lg text-center">
              <p className="text-yellow-100 text-xs">Won</p>
              <p className="text-white font-bold">₹{wallet?.totalWon || 0}</p>
            </div>
            <div className="bg-black/30 p-3 rounded-lg text-center">
              <p className="text-yellow-100 text-xs">Spent</p>
              <p className="text-white font-bold">₹{wallet?.totalSpent || 0}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab("deposit")}
            className={`flex-1 py-2 rounded-lg font-semibold ${
              activeTab === "deposit" ? "bg-green-600 text-white" : "bg-gray-800 text-gray-400"
            }`}
          >
            Deposit
          </button>
          <button
            onClick={() => setActiveTab("withdraw")}
            className={`flex-1 py-2 rounded-lg font-semibold ${
              activeTab === "withdraw" ? "bg-red-600 text-white" : "bg-gray-800 text-gray-400"
            }`}
          >
            Withdraw
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-2 rounded-lg font-semibold ${
              activeTab === "history" ? "bg-yellow-600 text-white" : "bg-gray-800 text-gray-400"
            }`}
          >
            History
          </button>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mb-4 p-3 rounded ${message.type === "success" ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"}`}>
            {message.text}
          </div>
        )}

        {/* Deposit Form */}
        {activeTab === "deposit" && (
          <div className="bg-[#020617] rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Add Money</h3>
            
            {/* QR Code Section */}
            <div className="bg-black p-4 rounded-lg mb-4 flex flex-col items-center">
              <p className="text-gray-400 text-sm mb-2">Scan to Pay</p>
              <div className="bg-white p-2 rounded-lg">
                <img 
                  src={qrCodeImage} 
                  alt="Payment QR Code" 
                  className="w-32 h-32 object-contain"
                />
              </div>
              <p className="text-gray-500 text-xs mt-2">Scan with any UPI app</p>
            </div>

            {/* UPI Payment Info */}
            <div className="bg-black p-4 rounded-lg mb-4">
              <p className="text-gray-400 text-sm mb-2">Or pay to this UPI ID:</p>
              <p className="text-green-400 font-bold text-lg">{UPI_ID}</p>
              <p className="text-gray-500 text-xs mt-2">Amount: ₹{amount || "0"}</p>
            </div>

            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Minimum ₹${MIN_DEPOSIT}`}
                  className="w-full bg-black border border-gray-700 px-4 py-2 rounded-lg text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">Payment Screenshot</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotChange}
                  className="w-full bg-black border border-gray-700 px-4 py-2 rounded-lg text-white"
                />
                {screenshotPreview && (
                  <div className="mt-2">
                    <p className="text-green-400 text-xs mb-1">✓ Screenshot selected</p>
                    <img 
                      src={screenshotPreview} 
                      alt="Payment screenshot" 
                      className="w-32 h-32 object-cover rounded-lg border border-gray-600"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Deposit Request"}
              </button>
            </form>
          </div>
        )}

        {/* Withdraw Form */}
        {activeTab === "withdraw" && (
          <div className="bg-[#020617] rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Withdraw Money</h3>
            
            <div className="bg-black p-4 rounded-lg mb-4">
              <p className="text-gray-400 text-sm">Available Balance</p>
              <p className="text-green-400 font-bold text-2xl">₹{wallet?.walletBalance || 0}</p>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Minimum ₹${MIN_WITHDRAWAL}`}
                  className="w-full bg-black border border-gray-700 px-4 py-2 rounded-lg text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">UPI ID</label>
                <input
                  type="text"
                  placeholder="yourname@upi"
                  className="w-full bg-black border border-gray-700 px-4 py-2 rounded-lg text-white"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Request Withdrawal"}
              </button>
            </form>
          </div>
        )}

        {/* Transaction History */}
        {activeTab === "history" && (
          <div className="bg-[#020617] rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Transaction History</h3>
            
            {transactions.length === 0 ? (
              <p className="text-gray-400 text-center">No transactions yet</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((txn) => (
                  <div key={txn._id} className="bg-black p-4 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="text-white font-semibold capitalize">{txn.type}</p>
                      <p className="text-gray-400 text-sm">{txn.description || new Date(txn.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${txn.type === "deposit" || txn.type === "prize_won" ? "text-green-400" : "text-red-400"}`}>
                        {txn.type === "deposit" || txn.type === "prize_won" ? "+" : "-"}₹{txn.amount}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        txn.status === "approved" ? "bg-green-600" : 
                        txn.status === "rejected" ? "bg-red-600" : "bg-yellow-600"
                      }`}>
                        {txn.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import adminApi from "../api/admin";
import api from "../api/axios";

// Helper for status color
const statusColor = {
  pending: "bg-yellow-500 text-black",
  approved: "bg-green-500 text-black",
  rejected: "bg-red-500 text-white"
};

// Function to open image in full screen
const openFullScreenImage = (imageSrc) => {
  const newWindow = window.open('', '_blank');
  if (newWindow) {
    newWindow.document.write(`
      <html>
        <head>
          <title>Payment Screenshot</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              background: #000; 
              min-height: 100vh; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              padding: 20px;
            }
            img { 
              max-width: 100%; 
              max-height: 90vh; 
              object-fit: contain; 
            }
          </style>
        </head>
        <body>
          <img src="${imageSrc}" />
        </body>
      </html>
    `);
    newWindow.document.close();
  }
};

export default function AdminDashboard() {
  const [contestants, setContestants] = useState([]);
  const [contestantsWithPhone, setContestantsWithPhone] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("contestants");
  const [joinRequests, setJoinRequests] = useState([]);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState("");
  
  // Transaction states
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [transactionLoading, setTransactionLoading] = useState(false);
  
  const navigate = useNavigate();

  const [tournamentForm, setTournamentForm] = useState({
    name: "",
    description: "",
    date: "",
    time: "",
    type: "Solo",
    entryFee: "",
    prizePool: "",
    maxParticipants: "",
    backgroundImage: ""
  });
  
  // Image upload state
  const [tournamentImage, setTournamentImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Handle tournament image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setTournamentImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload image to server
  const uploadTournamentImage = async () => {
    if (!tournamentImage) return null;
    
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', tournamentImage);
      
      const res = await api.post('/tournaments/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (res.data.success) {
        return res.data.data.path;
      }
      return null;
    } catch (err) {
      console.error("Error uploading image:", err);
      alert("Error uploading image");
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const [resultForm, setResultForm] = useState({
    tournament: "",
    date: "",
    winner: "",
    runnerUp: "",
    thirdPlace: "",
    totalParticipants: "",
    prizeDistributed: "",
    winnerPrize: "",
    runnerUpPrize: "",
    thirdPrize: "",
    matchType: "Solo"
  });

  // Password reset form state
  const [passwordInputs, setPasswordInputs] = useState({});

  useEffect(() => {
    fetchContestants();
    fetchTournaments();
    fetchJoinRequests();
  }, []);

  // Fetch join requests
  const fetchJoinRequests = async () => {
    setJoinLoading(true);
    try {
      const res = await adminApi.get("/join-requests");
      if (res.data.success) {
        setJoinRequests(res.data.data);
        setJoinError("");
      }
    } catch (err) {
      setJoinError(err.response?.data?.message || "Error fetching join requests");
    } finally {
      setJoinLoading(false);
    }
  };

  // Fetch deposits
  const fetchDeposits = async () => {
    setTransactionLoading(true);
    try {
      const res = await adminApi.get("/deposits");
      if (res.data.success) {
        setDeposits(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching deposits:", err);
    } finally {
      setTransactionLoading(false);
    }
  };

  // Fetch withdrawals
  const fetchWithdrawals = async () => {
    setTransactionLoading(true);
    try {
      const res = await adminApi.get("/withdrawals");
      if (res.data.success) {
        setWithdrawals(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching withdrawals:", err);
    } finally {
      setTransactionLoading(false);
    }
  };

  // Fetch contestants with phone and password
  const fetchContestantsWithPhone = async () => {
    try {
      const res = await adminApi.get("/contestants-with-phone");
      if (res.data.success) {
        setContestantsWithPhone(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching contestants with phone:", err);
    }
  };

  // Handle password input change
  const handlePasswordInputChange = (contestantId, value) => {
    setPasswordInputs(prev => ({
      ...prev,
      [contestantId]: value
    }));
  };

  // Generate random password
  const generatePassword = (contestantId) => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let password = "";
    for (let i = 0; i < 6; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPasswordInputs(prev => ({
      ...prev,
      [contestantId]: password
    }));
  };

  // Update contestant password
  const handlePasswordUpdate = async (contestantId) => {
    const newPassword = passwordInputs[contestantId];
    
    if (!newPassword || newPassword.length < 4) {
      alert("Password must be at least 4 characters");
      return;
    }

    try {
      const res = await adminApi.put(`/contestants/${contestantId}/password`, { newPassword });
      if (res.data.success) {
        alert(`Password updated for ${res.data.data.playerName}`);
        setPasswordInputs(prev => ({
          ...prev,
          [contestantId]: ""
        }));
        fetchContestantsWithPhone();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error updating password");
    }
  };

  // Update join request status
  const handleJoinRequestStatus = async (id, status) => {
    const adminNote = window.prompt(`Add a note for this action (optional):`);
    try {
      const res = await adminApi.put(`/join-requests/${id}`, { status, adminNote });
      if (res.data.success) {
        alert(`Join request ${status}`);
        fetchJoinRequests();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error updating join request");
    }
  };

  // Delete old join requests
  const handleDeleteJoinRequests = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete old join requests?");
    if (!confirmDelete) return;
    
    try {
      const res = await adminApi.delete("/join-requests?days=30");
      if (res.data.success) {
        alert(`Deleted ${res.data.deletedCount} old join requests`);
        fetchJoinRequests();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting join requests");
    }
  };

  // Delete all join requests
  const handleDeleteAllJoinRequests = async () => {
    const confirmDelete = window.confirm("⚠️ WARNING: This will delete ALL join requests! Are you absolutely sure?");
    if (!confirmDelete) return;
    
    try {
      const res = await adminApi.delete("/join-requests?deleteAll=true");
      if (res.data.success) {
        alert(`Deleted all ${res.data.deletedCount} join requests`);
        fetchJoinRequests();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting join requests");
    }
  };

  // Handle deposit approval/rejection
  const handleDepositStatus = async (id, status) => {
    const adminNote = window.prompt(`Add a note for this action (optional):`);
    try {
      const res = await adminApi.put(`/deposits/${id}`, { status, adminNote });
      if (res.data.success) {
        alert(`Deposit ${status}`);
        fetchDeposits();
        fetchContestants();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error updating deposit");
    }
  };

  // Delete old deposits
  const handleDeleteDeposits = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete old approved deposits (older than 30 days)?");
    if (!confirmDelete) return;
    
    try {
      const res = await adminApi.delete("/deposits?days=30");
      if (res.data.success) {
        alert(`Deleted ${res.data.deletedCount} old deposits`);
        fetchDeposits();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting deposits");
    }
  };

  // Delete all deposits
  const handleDeleteAllDeposits = async () => {
    const confirmDelete = window.confirm("⚠️ WARNING: This will delete ALL deposit records! Are you absolutely sure?");
    if (!confirmDelete) return;
    
    try {
      const res = await adminApi.delete("/deposits?deleteAll=true");
      if (res.data.success) {
        alert(`Deleted all ${res.data.deletedCount} deposit records`);
        fetchDeposits();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting deposits");
    }
  };

  // Handle withdrawal approval/rejection
  const handleWithdrawalStatus = async (id, status) => {
    const adminNote = window.prompt(`Add a note for this action (optional):`);
    try {
      const res = await adminApi.put(`/withdrawals/${id}`, { status, adminNote });
      if (res.data.success) {
        alert(`Withdrawal ${status}`);
        fetchWithdrawals();
        fetchContestants();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error updating withdrawal");
    }
  };

  // Delete old withdrawals
  const handleDeleteWithdrawals = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete old approved withdrawals (older than 30 days)?");
    if (!confirmDelete) return;
    
    try {
      const res = await adminApi.delete("/withdrawals?days=30");
      if (res.data.success) {
        alert(`Deleted ${res.data.deletedCount} old withdrawals`);
        fetchWithdrawals();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting withdrawals");
    }
  };

  // Delete all withdrawals
  const handleDeleteAllWithdrawals = async () => {
    const confirmDelete = window.confirm("⚠️ WARNING: This will delete ALL withdrawal records! Are you absolutely sure?");
    if (!confirmDelete) return;
    
    try {
      const res = await adminApi.delete("/withdrawals?deleteAll=true");
      if (res.data.success) {
        alert(`Deleted all ${res.data.deletedCount} withdrawal records`);
        fetchWithdrawals();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting withdrawals");
    }
  };

  // Delete old contestants (inactive with zero balance)
  const handleDeleteContestants = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete old inactive contestants (older than 30 days with zero balance)?");
    if (!confirmDelete) return;
    
    try {
      const res = await adminApi.delete("/contestants?days=30");
      if (res.data.success) {
        alert(`Deleted ${res.data.deletedCount} old contestants`);
        fetchContestants();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting contestants");
    }
  };

  // Delete all tournaments
  const handleDeleteTournaments = async () => {
    const confirmDelete = window.confirm("⚠️ WARNING: This will delete ALL tournaments! Are you absolutely sure?");
    if (!confirmDelete) return;
    
    try {
      const res = await adminApi.delete("/tournaments?deleteAll=true");
      if (res.data.success) {
        alert(`Deleted all ${res.data.deletedCount} tournaments`);
        fetchTournaments();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting tournaments");
    }
  };

  // Delete single tournament
  const handleDeleteSingleTournament = async (tournamentId, tournamentName) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${tournamentName}"?`);
    if (!confirmDelete) return;
    
    try {
      const res = await api.delete(`/tournaments/${tournamentId}`);
      if (res.data.success) {
        alert("Tournament deleted successfully");
        fetchTournaments();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting tournament");
    }
  };

  // Delete old completed tournaments
  const handleDeleteOldTournaments = async () => {
    const confirmDelete = window.confirm("Delete old completed tournaments (older than 30 days)?");
    if (!confirmDelete) return;
    
    try {
      const res = await adminApi.delete("/tournaments?days=30");
      if (res.data.success) {
        alert(`Deleted ${res.data.deletedCount} old tournaments`);
        fetchTournaments();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting tournaments");
    }
  };

  // Delete all results
  const handleDeleteResults = async () => {
    const confirmDelete = window.confirm("⚠️ WARNING: This will delete ALL match results! Are you absolutely sure?");
    if (!confirmDelete) return;
    
    try {
      const res = await adminApi.delete("/results?deleteAll=true");
      if (res.data.success) {
        alert(`Deleted all ${res.data.deletedCount} results`);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting results");
    }
  };

  // Delete old results
  const handleDeleteOldResults = async () => {
    const confirmDelete = window.confirm("Delete old results (older than 30 days)?");
    if (!confirmDelete) return;
    
    try {
      const res = await adminApi.delete("/results?days=30");
      if (res.data.success) {
        alert(`Deleted ${res.data.deletedCount} old results`);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting results");
    }
  };

  const fetchContestants = async () => {
    try {
      const res = await adminApi.get("/contestants");
      if (res.data.success) {
        setContestants(res.data.data);
        setError("");
      }
    } catch (err) {
      console.error("Error fetching contestants:", err);
      setError(err.response?.data?.message || "Connection error");
    }
  };

  const fetchTournaments = async () => {
    try {
      const res = await api.get("/tournaments");
      if (res.data.success) {
        setTournaments(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching tournaments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTournamentSubmit = async (e) => {
    e.preventDefault();
    try {
      // Upload image first if selected
      let backgroundImage = "";
      if (tournamentImage) {
        const imagePath = await uploadTournamentImage();
        if (imagePath) {
          backgroundImage = imagePath;
        }
      }

      const res = await api.post("/tournaments", {
        ...tournamentForm,
        backgroundImage,
        entryFee: parseInt(tournamentForm.entryFee),
        prizePool: parseInt(tournamentForm.prizePool),
        maxParticipants: parseInt(tournamentForm.maxParticipants)
      });
      if (res.data.success) {
        alert("Tournament created successfully 🔥");
        setTournamentForm({
          name: "",
          description: "",
          date: "",
          time: "",
          type: "Solo",
          entryFee: "",
          prizePool: "",
          maxParticipants: "",
          backgroundImage: ""
        });
        setTournamentImage(null);
        setImagePreview(null);
        fetchTournaments();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error creating tournament");
    }
  };

  const handleResultSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/tournaments/results", {
        ...resultForm,
        totalParticipants: parseInt(resultForm.totalParticipants),
        prizeDistributed: parseInt(resultForm.prizeDistributed),
        winnerPrize: parseInt(resultForm.winnerPrize),
        runnerUpPrize: parseInt(resultForm.runnerUpPrize),
        thirdPrize: parseInt(resultForm.thirdPrize)
      });
      if (res.data.success) {
        alert("Result added successfully 🏆");
        setResultForm({
          tournament: "",
          date: "",
          winner: "",
          runnerUp: "",
          thirdPlace: "",
          totalParticipants: "",
          prizeDistributed: "",
          winnerPrize: "",
          runnerUpPrize: "",
          thirdPrize: "",
          matchType: "Solo"
        });
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error adding result");
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      navigate("/");
    }
  };

  // Load transactions when tab changes
  useEffect(() => {
    if (activeTab === "deposits") {
      fetchDeposits();
    } else if (activeTab === "withdrawals") {
      fetchWithdrawals();
    } else if (activeTab === "contestantsPassword") {
      fetchContestantsWithPhone();
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white px-6 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-yellow-400">
          Admin Dashboard
        </h1>
        <button 
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold"
        >
          Logout
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-[#020617] p-6 rounded-xl">
          <p className="text-gray-400">Total Contestants</p>
          <h2 className="text-3xl font-bold mt-2">{contestants.length}</h2>
        </div>
        <div className="bg-[#020617] p-6 rounded-xl">
          <p className="text-gray-400">Total Tournaments</p>
          <h2 className="text-3xl font-bold mt-2">{tournaments.length}</h2>
        </div>
        <div className="bg-[#020617] p-6 rounded-xl">
          <p className="text-gray-400">Active Tournaments</p>
          <h2 className="text-3xl font-bold mt-2">{tournaments.filter(t => t.status === "Upcoming").length}</h2>
        </div>
        <div className="bg-[#020617] p-6 rounded-xl">
          <p className="text-gray-400">Pending Deposits</p>
          <h2 className="text-3xl font-bold mt-2 text-green-400">{deposits.filter(d => d.status === "pending").length}</h2>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <button
          onClick={() => setActiveTab("contestants")}
          className={`px-6 py-2 rounded-lg font-semibold transition ${
            activeTab === "contestants"
              ? "bg-yellow-500 text-black"
              : "bg-[#020617] text-white hover:bg-gray-800"
          }`}
        >
          Contestants
        </button>
        <button
          onClick={() => setActiveTab("contestantsPassword")}
          className={`px-6 py-2 rounded-lg font-semibold transition ${
            activeTab === "contestantsPassword"
              ? "bg-blue-500 text-white"
              : "bg-[#020617] text-white hover:bg-gray-800"
          }`}
        >
          Password Recovery
        </button>
        <button
          onClick={() => setActiveTab("tournaments")}
          className={`px-6 py-2 rounded-lg font-semibold transition ${
            activeTab === "tournaments"
              ? "bg-yellow-500 text-black"
              : "bg-[#020617] text-white hover:bg-gray-800"
          }`}
        >
          Tournaments
        </button>
        <button
          onClick={() => setActiveTab("results")}
          className={`px-6 py-2 rounded-lg font-semibold transition ${
            activeTab === "results"
              ? "bg-yellow-500 text-black"
              : "bg-[#020617] text-white hover:bg-gray-800"
          }`}
        >
          Match Results
        </button>
        <button
          onClick={() => setActiveTab("joinRequests")}
          className={`px-6 py-2 rounded-lg font-semibold transition ${
            activeTab === "joinRequests"
              ? "bg-yellow-500 text-black"
              : "bg-[#020617] text-white hover:bg-gray-800"
          }`}
        >
          Join Requests
        </button>
        <button
          onClick={() => setActiveTab("deposits")}
          className={`px-6 py-2 rounded-lg font-semibold transition ${
            activeTab === "deposits"
              ? "bg-green-500 text-black"
              : "bg-[#020617] text-white hover:bg-gray-800"
          }`}
        >
          Deposits
        </button>
        <button
          onClick={() => setActiveTab("withdrawals")}
          className={`px-6 py-2 rounded-lg font-semibold transition ${
            activeTab === "withdrawals"
              ? "bg-red-500 text-white"
              : "bg-[#020617] text-white hover:bg-gray-800"
          }`}
        >
          Withdrawals
        </button>
      </div>

      {/* Password Recovery Tab */}
      {activeTab === "contestantsPassword" && (
        <div className="bg-[#020617] rounded-xl p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-blue-400">
              Password Recovery - Contestant Details
            </h2>
            <button 
              onClick={fetchContestantsWithPhone}
              className="text-sm px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded"
            >
              Refresh
            </button>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            View registered contestants with their phone numbers and update passwords. 
            Players can request password recovery via WhatsApp.
          </p>

          {contestantsWithPhone.length === 0 ? (
            <div className="text-center py-8 text-gray-400">Loading contestants...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-gray-400 border-b border-gray-700">
                  <tr>
                    <th className="py-2 text-left">Name</th>
                    <th className="py-2 text-left">Phone Number</th>
                    <th className="py-2 text-left">Current Password</th>
                    <th className="py-2 text-left">Set New Password</th>
                  </tr>
                </thead>
                <tbody>
                  {contestantsWithPhone.map((c) => (
                    <tr key={c._id} className="border-b border-gray-800 hover:bg-gray-900/50">
                      <td className="py-2 font-semibold text-white">{c.playerName}</td>
                      <td className="py-2 text-green-400 font-bold">{c.phone}</td>
                      <td className="py-2">
                        {c.password ? (
                          <span className="bg-green-900 text-green-300 px-3 py-1 rounded text-xs font-mono">
                            {c.password}
                          </span>
                        ) : (
                          <span className="bg-red-900 text-red-300 px-3 py-1 rounded text-xs">
                            No Password
                          </span>
                        )}
                      </td>
                      <td className="py-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Enter new password"
                            className="bg-black border border-gray-600 px-3 py-2 rounded text-sm w-40 text-white"
                            value={passwordInputs[c._id] || ""}
                            onChange={(e) => handlePasswordInputChange(c._id, e.target.value)}
                          />
                          <button
                            onClick={() => generatePassword(c._id)}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-2 rounded text-xs"
                            title="Generate random password"
                          >
                            🎲
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Join Requests Tab */}
      {activeTab === "joinRequests" && (
        <div className="bg-[#020617] rounded-xl p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-yellow-400">
              Tournament Join Requests
            </h2>
            <div className="flex gap-2">
              <button 
                onClick={handleDeleteOldTournaments}
                className="text-sm px-3 py-1 bg-orange-600 hover:bg-orange-700 rounded"
                title="Delete old join requests (older than 30 days)"
              >
                🗑️ Delete Old
              </button>
              <button 
                onClick={handleDeleteAllJoinRequests}
                className="text-sm px-3 py-1 bg-red-600 hover:bg-red-700 rounded"
                title="Delete ALL join requests"
              >
                🗑️ Delete All
              </button>
              <button 
                onClick={fetchJoinRequests}
                className="text-sm px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded"
              >
                Refresh
              </button>
            </div>
          </div>
          {joinError && <div className="mb-4 p-2 bg-red-900 text-red-300 text-sm rounded">{joinError}</div>}
          {joinLoading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : joinRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No join requests yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-gray-400 border-b border-gray-700">
                  <tr>
                    <th className="py-2 text-left">Player Name</th>
                    <th className="py-2 text-left">BGMI ID</th>
                    <th className="py-2 text-left">Phone</th>
                    <th className="py-2 text-left">Tournament</th>
                    <th className="py-2 text-left">Payment Screenshot</th>
                    <th className="py-2 text-left">Status</th>
                    <th className="py-2 text-left">Admin Note</th>
                    <th className="py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {joinRequests.map((jr) => (
                    <tr key={jr._id} className="border-b border-gray-800 hover:bg-gray-900/50">
                      <td className="py-2">{jr.playerName}</td>
                      <td className="py-2">{jr.bgmiId}</td>
                      <td className="py-2">{jr.phone}</td>
                      <td className="py-2">{jr.tournamentId?.name || "-"}</td>
                      <td className="py-2">
                        {jr.paymentMethod === "wallet" ? (
                          <span className="text-green-400 font-semibold">Wallet Paid (₹{jr.amountPaid})</span>
                        ) : jr.paymentScreenshot && jr.paymentScreenshot !== "wallet_payment" ? (
                          <a href={`http://localhost:5000/${jr.paymentScreenshot}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">View Screenshot</a>
                        ) : jr.paymentScreenshot === "wallet_payment" ? (
                          <span className="text-green-400">Wallet Payment</span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-2">
                        <span className={`px-3 py-1 rounded-full font-semibold ${statusColor[jr.status] || "bg-gray-700 text-white"}`}>
                          {jr.status}
                        </span>
                      </td>
                      <td className="py-2 text-xs text-gray-400">{jr.adminNote || "-"}</td>
                      <td className="py-2">
                        {jr.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleJoinRequestStatus(jr._id, "approved")}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded mr-2"
                            >Approve</button>
                            <button
                              onClick={() => handleJoinRequestStatus(jr._id, "rejected")}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                            >Reject</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Deposits Tab */}
      {activeTab === "deposits" && (
        <div className="bg-[#020617] rounded-xl p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-green-400">
              Deposit Requests
            </h2>
            <div className="flex gap-2">
              <button 
                onClick={handleDeleteDeposits}
                className="text-sm px-3 py-1 bg-orange-600 hover:bg-orange-700 rounded"
                title="Delete old approved deposits (older than 30 days)"
              >
                🗑️ Delete Old
              </button>
              <button 
                onClick={handleDeleteAllDeposits}
                className="text-sm px-3 py-1 bg-red-600 hover:bg-red-700 rounded"
                title="Delete ALL deposit records"
              >
                🗑️ Delete All
              </button>
              <button 
                onClick={fetchDeposits}
                className="text-sm px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded"
              >
                Refresh
              </button>
            </div>
          </div>
          {transactionLoading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : deposits.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No deposit requests yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-gray-400 border-b border-gray-700">
                  <tr>
                    <th className="py-2 text-left">Player</th>
                    <th className="py-2 text-left">Phone</th>
                    <th className="py-2 text-left">Amount</th>
                    <th className="py-2 text-left">Transaction ID</th>
                    <th className="py-2 text-left">Screenshot</th>
                    <th className="py-2 text-left">Date</th>
                    <th className="py-2 text-left">Status</th>
                    <th className="py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deposits.map((d) => (
                    <tr key={d._id} className="border-b border-gray-800 hover:bg-gray-900/50">
                      <td className="py-2">{d.contestantId?.playerName || "-"}</td>
                      <td className="py-2">{d.contestantId?.phone || "-"}</td>
                      <td className="py-2 text-green-400 font-bold">₹{d.amount}</td>
                      <td className="py-2 text-xs">{d.upiTransactionId || "-"}</td>
                      <td className="py-2">
                        {d.paymentScreenshot ? (
                          d.paymentScreenshot.startsWith("data:") ? (
                            <button
                              onClick={() => openFullScreenImage(d.paymentScreenshot)}
                              className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80 transition"
                            >
                              <img 
                                src={d.paymentScreenshot} 
                                alt="Payment" 
                                className="w-full h-full object-cover rounded"
                              />
                            </button>
                          ) : (
                            <a href={`http://localhost:5000/${d.paymentScreenshot}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">View</a>
                          )
                        ) : "-"}
                      </td>
                      <td className="py-2 text-gray-400">{new Date(d.createdAt).toLocaleDateString()}</td>
                      <td className="py-2">
                        <span className={`px-3 py-1 rounded-full font-semibold ${statusColor[d.status] || "bg-gray-700 text-white"}`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="py-2">
                        {d.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleDepositStatus(d._id, "approved")}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded mr-2"
                            >Approve</button>
                            <button
                              onClick={() => handleDepositStatus(d._id, "rejected")}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                            >Reject</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Withdrawals Tab */}
      {activeTab === "withdrawals" && (
        <div className="bg-[#020617] rounded-xl p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-red-400">
              Withdrawal Requests
            </h2>
            <div className="flex gap-2">
              <button 
                onClick={handleDeleteWithdrawals}
                className="text-sm px-3 py-1 bg-orange-600 hover:bg-orange-700 rounded"
                title="Delete old approved withdrawals (older than 30 days)"
              >
                🗑️ Delete Old
              </button>
              <button 
                onClick={handleDeleteAllWithdrawals}
                className="text-sm px-3 py-1 bg-red-600 hover:bg-red-700 rounded"
                title="Delete ALL withdrawal records"
              >
                🗑️ Delete All
              </button>
              <button 
                onClick={fetchWithdrawals}
                className="text-sm px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded"
              >
                Refresh
              </button>
            </div>
          </div>
          {transactionLoading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : withdrawals.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No withdrawal requests yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-gray-400 border-b border-gray-700">
                  <tr>
                    <th className="py-2 text-left">Player</th>
                    <th className="py-2 text-left">Phone</th>
                    <th className="py-2 text-left">Amount</th>
                    <th className="py-2 text-left">UPI/Bank</th>
                    <th className="py-2 text-left">Date</th>
                    <th className="py-2 text-left">Status</th>
                    <th className="py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((w) => (
                    <tr key={w._id} className="border-b border-gray-800 hover:bg-gray-900/50">
                      <td className="py-2">{w.contestantId?.playerName || "-"}</td>
                      <td className="py-2">{w.contestantId?.phone || "-"}</td>
                      <td className="py-2 text-red-400 font-bold">₹{w.amount}</td>
                      <td className="py-2 text-xs">{w.bankAccountNumber || w.upiId || "-"}</td>
                      <td className="py-2 text-gray-400">{new Date(w.createdAt).toLocaleDateString()}</td>
                      <td className="py-2">
                        <span className={`px-3 py-1 rounded-full font-semibold ${statusColor[w.status] || "bg-gray-700 text-white"}`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="py-2">
                        {w.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleWithdrawalStatus(w._id, "approved")}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded mr-2"
                            >Approve</button>
                            <button
                              onClick={() => handleWithdrawalStatus(w._id, "rejected")}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                            >Reject</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Contestants Tab */}
      {activeTab === "contestants" && (
        <div className="bg-[#020617] rounded-xl p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-yellow-400">
              Registered Contestants
            </h2>
            <div className="flex gap-2">
              <button 
                onClick={handleDeleteContestants}
                className="text-sm px-3 py-1 bg-orange-600 hover:bg-orange-700 rounded"
                title="Delete old inactive contestants (older than 30 days with zero balance)"
              >
                🗑️ Delete Old Inactive
              </button>
              <button 
                onClick={fetchContestants}
                className="text-sm px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded"
              >
                Refresh
              </button>
            </div>
          </div>

          {error && <div className="mb-4 p-2 bg-red-900 text-red-300 text-sm rounded">{error}</div>}

          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : contestants.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No contestants yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-gray-400 border-b border-gray-700">
                  <tr>
                    <th className="py-2 text-left">Name</th>
                    <th className="py-2 text-left">BGMI ID</th>
                    <th className="py-2 text-left">Phone</th>
                    <th className="py-2 text-left">Email</th>
                    <th className="py-2 text-left">Wallet</th>
                  </tr>
                </thead>
                <tbody>
                  {contestants.map((c) => (
                    <tr key={c._id} className="border-b border-gray-800 hover:bg-gray-900/50">
                      <td className="py-2">{c.playerName}</td>
                      <td className="py-2">{c.bgmiId || "-"}</td>
                      <td className="py-2">{c.phone}</td>
                      <td className="py-2 text-xs text-gray-400">{c.email}</td>
                      <td className="py-2 text-green-400">₹{c.walletBalance || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tournaments Tab */}
      {activeTab === "tournaments" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Tournament Form */}
          <div className="bg-[#020617] rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-yellow-400">
              Create Tournament
            </h2>
            <form onSubmit={handleTournamentSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Tournament Name"
                value={tournamentForm.name}
                onChange={(e) => setTournamentForm({...tournamentForm, name: e.target.value})}
                className="w-full bg-black border border-gray-700 px-4 py-2 rounded-lg text-sm"
                required
              />
              <textarea
                placeholder="Description"
                value={tournamentForm.description}
                onChange={(e) => setTournamentForm({...tournamentForm, description: e.target.value})}
                className="w-full bg-black border border-gray-700 px-4 py-2 rounded-lg text-sm"
                rows="2"
              />
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={tournamentForm.date} onChange={(e) => setTournamentForm({...tournamentForm, date: e.target.value})} className="bg-black border border-gray-700 px-4 py-2 rounded-lg text-sm" required />
                <input type="time" value={tournamentForm.time} onChange={(e) => setTournamentForm({...tournamentForm, time: e.target.value})} className="bg-black border border-gray-700 px-4 py-2 rounded-lg text-sm" required />
              </div>
              <select value={tournamentForm.type} onChange={(e) => setTournamentForm({...tournamentForm, type: e.target.value})} className="w-full bg-black border border-gray-700 px-4 py-2 rounded-lg text-sm">
                <option>Solo</option>
                <option>Duo</option>
                <option>Squad</option>
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="Entry Fee (₹)" value={tournamentForm.entryFee} onChange={(e) => setTournamentForm({...tournamentForm, entryFee: e.target.value})} className="bg-black border border-gray-700 px-4 py-2 rounded-lg text-sm" required />
                <input type="number" placeholder="Prize Pool (₹)" value={tournamentForm.prizePool} onChange={(e) => setTournamentForm({...tournamentForm, prizePool: e.target.value})} className="bg-black border border-gray-700 px-4 py-2 rounded-lg text-sm" required />
              </div>
              <input type="number" placeholder="Max Participants" value={tournamentForm.maxParticipants} onChange={(e) => setTournamentForm({...tournamentForm, maxParticipants: e.target.value})} className="w-full bg-black border border-gray-700 px-4 py-2 rounded-lg text-sm" required />
              
              {/* Tournament Background Image Upload */}
              <div className="space-y-2">
                <label className="block text-sm text-gray-400">Tournament Background Image (Optional)</label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="bg-black border border-gray-700 px-4 py-2 rounded-lg text-sm flex-1"
                  />
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setTournamentImage(null);
                        setImagePreview(null);
                      }}
                      className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg text-sm"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {imagePreview && (
                  <div className="relative inline-block">
                    <img src={imagePreview} alt="Preview" className="h-20 w-auto rounded-lg" />
                    <span className="text-xs text-green-400 block mt-1">Image selected</span>
                  </div>
                )}
              </div>
              
              <button 
                type="submit"
                disabled={uploadingImage}
                className="w-full bg-green-600 hover:bg-green-700 py-2 rounded-lg font-semibold text-sm disabled:opacity-50"
              >
                {uploadingImage ? "Creating..." : "Create Tournament"}
              </button>
            </form>
          </div>

          {/* Tournaments List */}
          <div className="bg-[#020617] rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-yellow-400">
                Active Tournaments
              </h2>
              <div className="flex gap-2">
                <button 
                  onClick={handleDeleteOldTournaments}
                  className="text-sm px-3 py-1 bg-orange-600 hover:bg-orange-700 rounded"
                  title="Delete old completed tournaments (older than 30 days)"
                >
                  🗑️ Delete Old
                </button>
                <button 
                  onClick={handleDeleteTournaments}
                  className="text-sm px-3 py-1 bg-red-600 hover:bg-red-700 rounded"
                  title="Delete ALL tournaments"
                >
                  🗑️ Delete All
                </button>
              </div>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {tournaments.length === 0 ? (
                <p className="text-gray-400 text-sm">No tournaments created yet</p>
              ) : (
                tournaments.map((t) => (
                  <div key={t._id} className="bg-black p-3 rounded-lg border border-gray-700 text-sm">
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-yellow-300">{t.name}</p>
                      <button
                        onClick={() => handleDeleteSingleTournament(t._id, t.name)}
                        className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
                        title="Delete this tournament"
                      >
                        🗑️
                      </button>
                    </div>
                    <p className="text-gray-400">📅 {t.date} ⏰ {t.time}</p>
                    <p className="text-gray-400">🎮 {t.type} | Entry: ₹{t.entryFee} | Prize: ₹{t.prizePool}</p>
                    <p className="text-gray-400">👥 {t.participants?.length || 0}/{t.maxParticipants} participants</p>
                    <span className={`inline-block mt-2 text-xs px-2 py-1 rounded ${t.status === "Upcoming" ? "bg-green-600" : "bg-blue-600"}`}>
                      {t.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Results Tab */}
      {activeTab === "results" && (
        <div className="bg-[#020617] rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-yellow-400">
              Add Match Result
            </h2>
            <div className="flex gap-2">
              <button 
                onClick={handleDeleteOldResults}
                className="text-sm px-3 py-1 bg-orange-600 hover:bg-orange-700 rounded"
                title="Delete old results (older than 30 days)"
              >
                🗑️ Delete Old
              </button>
              <button 
                onClick={handleDeleteResults}
                className="text-sm px-3 py-1 bg-red-600 hover:bg-red-700 rounded"
                title="Delete ALL results"
              >
                🗑️ Delete All
              </button>
            </div>
          </div>
          <form onSubmit={handleResultSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Tournament Name"
              value={resultForm.tournament}
              onChange={(e) => setResultForm({...resultForm, tournament: e.target.value})}
              className="bg-black border border-gray-700 px-4 py-2 rounded-lg text-sm"
              required
            />
            <input
              type="date"
              value={resultForm.date}
              onChange={(e) => setResultForm({...resultForm, date: e.target.value})}
              className="bg-black border border-gray-700 px-4 py-2 rounded-lg text-sm"
              required
            />
            <input
              type="text"
              placeholder="Winner Name"
              value={resultForm.winner}
              onChange={(e) => setResultForm({...resultForm, winner: e.target.value})}
              className="bg-black border border-gray-700 px-4 py-2 rounded-lg text-sm"
              required
            />
            <input
              type="text"
              placeholder="Runner Up"
              value={resultForm.runnerUp}
              onChange={(e) => setResultForm({...resultForm, runnerUp: e.target.value})}
              className="bg-black border border-gray-700 px-4 py-2 rounded-lg text-sm"
            />
            <input
              type="text"
              placeholder="Third Place"
              value={resultForm.thirdPlace}
              onChange={(e) => setResultForm({...resultForm, thirdPlace: e.target.value})}
              className="bg-black border border-gray-700 px-4 py-2 rounded-lg text-sm"
            />
            <select value={resultForm.matchType} onChange={(e) => setResultForm({...resultForm, matchType: e.target.value})} className="bg-black border border-gray-700 px-4 py-2 rounded-lg text-sm">
              <option>Solo</option>
              <option>Duo</option>
              <option>Squad</option>
            </select>
            <input type="number" placeholder="Total Participants" value={resultForm.totalParticipants} onChange={(e) => setResultForm({...resultForm, totalParticipants: e.target.value})} className="bg-black border border-gray-700 px-4 py-2 rounded-lg text-sm" required />
            <input type="number" placeholder="Prize Distributed (₹)" value={resultForm.prizeDistributed} onChange={(e) => setResultForm({...resultForm, prizeDistributed: e.target.value})} className="bg-black border border-gray-700 px-4 py-2 rounded-lg text-sm" required />
            <input type="number" placeholder="1st Prize (₹)" value={resultForm.winnerPrize} onChange={(e) => setResultForm({...resultForm, winnerPrize: e.target.value})} className="bg-black border border-gray-700 px-4 py-2 rounded-lg text-sm" required />
            <input type="number" placeholder="2nd Prize (₹)" value={resultForm.runnerUpPrize} onChange={(e) => setResultForm({...resultForm, runnerUpPrize: e.target.value})} className="bg-black border border-gray-700 px-4 py-2 rounded-lg text-sm" />
            <input type="number" placeholder="3rd Prize (₹)" value={resultForm.thirdPrize} onChange={(e) => setResultForm({...resultForm, thirdPrize: e.target.value})} className="bg-black border border-gray-700 px-4 py-2 rounded-lg text-sm" />
            <button className="w-full md:col-span-2 bg-green-600 hover:bg-green-700 py-2 rounded-lg font-semibold">
              Add Result
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

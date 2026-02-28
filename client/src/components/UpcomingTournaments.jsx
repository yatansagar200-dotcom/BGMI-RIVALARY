import React, { useState, useEffect, useRef } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function UpcomingTournaments({ textcolor = "text-white" }) {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [joiningTournament, setJoiningTournament] = useState(false);
  const [joinStatuses, setJoinStatuses] = useState({});
  const [walletBalance, setWalletBalance] = useState(0);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const formRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTournaments();
    fetchJoinStatuses();
    fetchWalletBalance();
  }, []);

  // Fetch wallet balance
  const fetchWalletBalance = async () => {
    const contestantId = localStorage.getItem("contestantId");
    if (!contestantId) return;
    
    try {
      const res = await api.get(`/contestants/wallet/${contestantId}`);
      if (res.data.success) {
        setWalletBalance(res.data.data.walletBalance || 0);
      }
    } catch (err) {
      console.error("Error fetching wallet:", err);
    }
  };

  // Fetch join request statuses for this player
  const fetchJoinStatuses = async () => {
    const playerName = localStorage.getItem("playerName");
    const bgmiId = localStorage.getItem("bgmiId");
    const phone = localStorage.getItem("phone");
    if (!playerName || !bgmiId || !phone) return;
    try {
      const res = await api.get("/contestants/join-requests", {
        params: { playerName, bgmiId, phone },
      });
      if (res.data.success) {
        // Map tournamentId to status
        const statusMap = {};
        res.data.data.forEach((jr) => {
          statusMap[jr.tournamentId] = jr.status;
        });
        setJoinStatuses(statusMap);
      }
    } catch (err) {
      // ignore
    }
  };

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const res = await api.get("/tournaments?status=Upcoming,Live");
      if (res.data.success) {
        setTournaments(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching tournaments:", err);
    } finally {
      setLoading(false);
    }
  };

  // Join tournament with wallet
  const handleJoinWithWallet = async (tournament) => {
    const contestantId = localStorage.getItem("contestantId");
    const playerName = localStorage.getItem("playerName");
    const phone = localStorage.getItem("phone");

    // Use default BGMI ID if not set (can be updated later in profile)
    const bgmiId = localStorage.getItem("bgmiId") || "BGMI" + Date.now();

    if (!contestantId) {
      alert("Please register first to join tournaments");
      navigate("/register");
      return;
    }

    if (!playerName || !phone) {
      alert("Please complete your registration first");
      navigate("/register");
      return;
    }

    // Check wallet balance
    if (walletBalance < tournament.entryFee) {
      setShowAddMoney(true);
      setSelectedTournament(tournament);
      return;
    }

    try {
      setJoiningTournament(true);
      
      const res = await api.post("/contestants/tournament/join-with-wallet", {
        contestantId,
        tournamentId: tournament._id,
        playerName,
        bgmiId,
        phone
      });

      if (res.data.success) {
        alert(`Successfully joined ${tournament.name}! ₹${tournament.entryFee} deducted from wallet.\n\n⏳ Your join request will be verified within 30 minutes or less.`);
        setSelectedTournament(null);
        setShowAddMoney(false);
        fetchTournaments();
        fetchJoinStatuses();
        fetchWalletBalance(); // Refresh wallet balance
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error joining tournament");
    } finally {
      setJoiningTournament(false);
    }
  };

  // Old join with payment screenshot (kept for backward compatibility)
  const handleJoinTournament = async (e) => {
    e.preventDefault();
    if (!selectedTournament) return;

    try {
      setJoiningTournament(true);
      const form = formRef.current;
      const playerName = form.playerName.value;
      const bgmiId = form.bgmiId.value;
      const phone = form.phone.value;
      const paymentScreenshot = form.paymentScreenshot.dataset.url;

      const res = await api.post("/contestants/tournament/join", {
        playerName,
        bgmiId,
        phone,
        tournamentId: selectedTournament._id,
        paymentScreenshot,
      });

      if (res.data.success) {
        alert("Successfully joined tournament 🔥");
        setSelectedTournament(null);
        fetchTournaments();
        fetchJoinStatuses();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error joining tournament");
    } finally {
      setJoiningTournament(false);
    }
  };

  if (loading) {
    return (
      <section className="bg-slate-950 py-16 px-4">
        <h2 className="text-3xl font-bold text-white text-center mb-10">
          Upcoming Tournaments
        </h2>
        <p className="text-center text-gray-400">Loading tournaments...</p>
      </section>
    );
  }

  return (
    <section className="bg-slate-950 py-16 px-4">
      <h2 className={`text-3xl font-bold text-center mb-10 ${textcolor}`}>
        Upcoming Tournaments
      </h2>

      {/* Wallet Balance Banner */}
      <div className="max-w-5xl mx-auto mb-6 bg-yellow-600/20 border border-yellow-600 rounded-lg p-3 flex justify-between items-center">
        <span className="text-yellow-400 font-semibold">Your Wallet Balance:</span>
        <span className="text-white font-bold text-xl">₹{walletBalance}</span>
        <button 
          onClick={() => navigate("/wallet")}
          className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm font-semibold"
        >
          Add Money
        </button>
      </div>

      {tournaments.length === 0 ? (
        <p className="text-center text-gray-400">No tournaments available yet</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {tournaments.map((t) => {
            const contestantId = localStorage.getItem("contestantId");
            const alreadyJoined = t.participants.includes(contestantId);
            const joinStatus = joinStatuses[t._id];
            const canJoinWithWallet = walletBalance >= t.entryFee;
            
            return (
              <div
                key={t._id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-green-500 transition overflow-hidden"
                style={t.backgroundImage ? {
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.9)), url(http://localhost:5000${t.backgroundImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                } : {}}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-white">{t.name}</h3>
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                    t.status === "Upcoming" ? "bg-green-500 text-black" :
                    t.status === "Live" ? "bg-yellow-500 text-black animate-pulse" :
                    "bg-gray-500 text-white"
                  }`}>
                    {t.status}
                  </span>
                </div>

                <div className="text-gray-400 text-sm space-y-1 mb-4">
                  <p>📅 {t.date}</p>
                  <p>⏰ {t.time}</p>
                  <p>🎮 {t.type}</p>
                  <p>💰 Entry Fee: ₹{t.entryFee}</p>
                  <p>🏆 Prize Pool: ₹{t.prizePool}</p>
                  <p>
                    👥 Participants: {t.participants.length}/
                    {t.maxParticipants}
                  </p>
                  <p>
                    🟢 Spots Available:{" "}
                    {t.maxParticipants - t.participants.length}
                    {alreadyJoined ? " (You have already joined)" : ""}
                  </p>
                  {t.description && (
                    <p className="text-xs text-gray-500">{t.description}</p>
                  )}
                  {joinStatus && (
                    <p className="mt-2 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full font-semibold ${
                          joinStatus === "approved"
                            ? "bg-green-600 text-white"
                            : joinStatus === "pending"
                            ? "bg-yellow-500 text-black"
                            : "bg-red-600 text-white"
                        }`}
                      >
                        {joinStatus.charAt(0).toUpperCase() +
                          joinStatus.slice(1)}
                      </span>{" "}
                      <span className="ml-2">Join Request Status</span>
                    </p>
                  )}
                </div>

                {!alreadyJoined && (
                  <div className="space-y-2">
                    {/* Primary Join with Wallet Button */}
                    <button
                      onClick={() => handleJoinWithWallet(t)}
                      disabled={joiningTournament || t.participants.length >= t.maxParticipants}
                      className={`w-full py-2 rounded-lg font-semibold ${
                        canJoinWithWallet
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-gray-600 text-gray-300 cursor-not-allowed"
                      }`}
                    >
                      {joiningTournament 
                        ? "Joining..." 
                        : canJoinWithWallet 
                          ? `Join Now (₹${t.entryFee} from Wallet)` 
                          : `Join Now (Need ₹${t.entryFee})`
                      }
                    </button>
                    
                    {/* Show Add Money button if insufficient balance */}
                    {!canJoinWithWallet && (
                      <button
                        onClick={() => {
                          setShowAddMoney(true);
                          setSelectedTournament(t);
                        }}
                        className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded-lg font-semibold"
                      >
                        Add Money to Wallet
                      </button>
                    )}
                  </div>
                )}
                {alreadyJoined && (
                  <div className="w-full bg-gray-700 text-white py-2 rounded-lg font-semibold text-center">
                    Already Joined
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Money Modal */}
      {showAddMoney && selectedTournament && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#020617] rounded-xl p-8 max-w-md w-full text-white border border-gray-700">
            <h3 className="text-2xl font-bold text-yellow-400 mb-4">
              Insufficient Balance
            </h3>
            
            <div className="space-y-3 mb-6">
              <p className="text-gray-300">
                <strong>Tournament:</strong> {selectedTournament.name}
              </p>
              <p className="text-gray-300">
                <strong>Entry Fee:</strong> ₹{selectedTournament.entryFee}
              </p>
              <p className="text-gray-300">
                <strong>Your Balance:</strong> ₹{walletBalance}
              </p>
              <p className="text-red-400">
                <strong>Short by:</strong> ₹{selectedTournament.entryFee - walletBalance}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddMoney(false);
                  setSelectedTournament(null);
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  navigate("/wallet");
                }}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 py-2 rounded-lg font-semibold"
              >
                Add Money
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

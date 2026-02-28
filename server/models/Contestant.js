import mongoose from "mongoose"

const contestantSchema = new mongoose.Schema(
  {
    playerName: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    bgmiId: { type: String, default: "" },
    bio: { type: String, default: "" },
    avatar: { type: String, default: "" },
    
    // Wallet fields
    walletBalance: { type: Number, default: 0 },
    totalDeposited: { type: Number, default: 0 },
    totalWon: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    totalWithdrawn: { type: Number, default: 0 },
    pendingBalance: { type: Number, default: 0 },
    
    // Stats
    rank: { type: String, default: "Bronze" },
    totalMatches: { type: Number, default: 0 },
    totalKills: { type: Number, default: 0 },
    totalWins: { type: Number, default: 0 },
    
    // Status
    status: { type: String, default: "active", enum: ["active", "banned"] }
  },
  { timestamps: true }
)

export default mongoose.model("Contestant", contestantSchema)

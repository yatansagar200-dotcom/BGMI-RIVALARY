import mongoose from "mongoose"

const joinRequestSchema = new mongoose.Schema(
  {
    playerName: { type: String, required: true },
    bgmiId: { type: String, required: true },
    phone: { type: String, required: true },
    tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: "Tournament", required: true },
    paymentScreenshot: { type: String, default: "" },
    paymentMethod: { type: String, default: "screenshot", enum: ["screenshot", "wallet"] },
    amountPaid: { type: Number, default: 0 },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    adminNote: { type: String },
  },
  { timestamps: true }
)

export default mongoose.model("JoinRequest", joinRequestSchema)

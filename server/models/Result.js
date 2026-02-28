import mongoose from "mongoose"

const resultSchema = new mongoose.Schema(
  {
    tournament: { type: String, required: true },
    date: { type: String, required: true },
    winner: { type: String, required: true },
    runnerUp: { type: String },
    thirdPlace: { type: String },
    totalParticipants: { type: Number },
    prizeDistributed: { type: Number },
    winnerPrize: { type: Number },
    runnerUpPrize: { type: Number },
    thirdPrize: { type: Number },
    matchType: { type: String, enum: ["Solo", "Duo", "Squad"] },
  },
  { timestamps: true }
)

export default mongoose.model("Result", resultSchema)

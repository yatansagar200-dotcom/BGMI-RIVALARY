import mongoose from "mongoose"

const tournamentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    date: { type: String, required: true },
    time: { type: String, required: true },
    type: { type: String, enum: ["Solo", "Duo", "Squad"], required: true },
    entryFee: { type: Number, required: true },
    prizePool: { type: Number, required: true },
    maxParticipants: { type: Number, required: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "Contestant" }],
    status: { 
      type: String, 
      enum: ["Upcoming", "Live", "Completed"], 
      default: "Upcoming" 
    },
    winner: { type: String },
    runnerUp: { type: String },
    thirdPlace: { type: String },
    backgroundImage: { type: String },
  },
  { timestamps: true }
)

export default mongoose.model("Tournament", tournamentSchema)

import mongoose from "mongoose"

const transactionSchema = new mongoose.Schema(
  {
    contestantId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Contestant", 
      required: true 
    },
    type: { 
      type: String, 
      enum: ["deposit", "withdraw", "tournament_entry", "prize_won"], 
      required: true 
    },
    amount: { type: Number, required: true },
    
    // For Deposits
    paymentScreenshot: { type: String, default: "" },
    upiTransactionId:{type :String ,default :""},
    
    // For Withdrawals
    bankAccountNumber:{type :String ,default :""},
    ifscCode:{type :String ,default :""},
    
    // Common
   status:{type:
     String,
     enum:[ "pending","approved","rejected"],
     default:"pending"
   } ,
   
   adminNote:{type:
     String,
     default:""
   } ,
   
   tournamentId:{type:mongoose.Schema.Types.ObjectId,
       ref:"Tournament",
       default :null
   
   } ,
   
  description:{type:
        String,
        default :""
  }
  
  },

{timestamps:true}
)

export default mongoose.model("Transaction",transactionSchema)

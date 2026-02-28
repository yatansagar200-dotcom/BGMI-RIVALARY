import express from "express"
import Transaction from "../models/Transaction.js"
import Contestant from "../models/Contestant.js"

const router = express.Router()

// Get UPI details for deposit
router.get("/upi-details", (req, res) => {
  res.json({
    success: true,
    data: {
      upiId: process.env.ADMIN_UPI || "7668261126@ybl",
      upiName: process.env.ADMIN_UPI_NAME || "BGMI Tournament",
      note: "Send exact amount and upload payment screenshot"
    }
  })
})

// Get contestant's transaction history
router.get("/my-transactions", async (req, res) => {
  try {
    const { contestantId } = req.query
    
    if (!contestantId) {
      return res.status(400).json({
        success: false,
        message: "Contestant ID is required"
      })
    }

    const transactions = await Transaction.find({ contestantId })
      .sort({ createdAt: -1 })
      .limit(50)

    res.json({
      success: true,
      data: transactions,
      total: transactions.length
    })
  } catch (err) {
    console.error("Error fetching transactions:", err)
    res.status(500).json({
      success: false,
      message: "Error fetching transactions",
      error: err.message
    })
  }
})

// Get contestant's wallet balance
router.get("/balance/:contestantId", async (req, res) => {
  try {
    const { contestantId } = req.params
    
    const contestant = await Contestant.findById(contestantId)
    
    if (!contestant) {
      return res.status(404).json({
        success: false,
        message: "Contestant not found"
      })
    }

    res.json({
      success: true,
      data: {
        walletBalance: contestant.walletBalance,
        pendingBalance: contestant.pendingBalance,
        totalDeposited: contestant.totalDeposited,
        totalWithdrawn: contestant.totalWithdrawn,
        totalWon: contestant.totalWon,
        totalSpent: contestant.totalSpent
      }
    })
  } catch (err) {
    console.error("Error fetching balance:", err)
    res.status(500).json({
      success: false,
      message: "Error fetching balance",
      error: err.message
    })
  }
})

// Request deposit (upload payment screenshot)
router.post("/deposit", async (req, res) => {
  try {
    const { contestantId, amount, paymentScreenshot, upiTransactionId } = req.body

    // Validation
    if (!contestantId || !amount || !paymentScreenshot) {
      return res.status(400).json({
        success: false,
        message: "All fields are required: contestantId, amount, paymentScreenshot"
      })
    }

    if (amount < 10) {
      return res.status(400).json({
        success: false,
        message: "Minimum deposit amount is ₹10"
      })
    }

    // Check if contestant exists
    const contestant = await Contestant.findById(contestantId)
    if (!contestant) {
      return res.status(404).json({
        success: false,
        message: "Contestant not found"
      })
    }

    // Create deposit request
    const transaction = new Transaction({
      contestantId,
      type: "deposit",
      amount: Number(amount),
      paymentScreenshot,
      upiTransactionId: upiTransactionId || "",
      status: "pending",
      description: `Deposit request for ₹${amount}`
    })

    await transaction.save()

    res.status(201).json({
      success: true,
      message: "Deposit request submitted. Waiting for admin approval.",
      data: transaction
    })
  } catch (err) {
    console.error("Deposit error:", err)
    res.status(500).json({
      success: false,
      message: "Error processing deposit request",
      error: err.message
    })
  }
})

// Request withdrawal
router.post("/withdraw", async (req, res) => {
  try {
    const { contestantId, amount, bankAccountNumber, ifscCode } = req.body

    // Validation
    if (!contestantId || !amount || !bankAccountNumber || !ifscCode) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      })
    }

    const contestant = await Contestant.findById(contestantId)
    if (!contestant) {
      return res.status(404).json({
        success: false,
        message: "Contestant not found"
      })
    }

    if (contestant.walletBalance < amount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance"
      })
    }

    if (amount < 100) {
      return res.status(400).json({
        success: false,
        message: "Minimum withdrawal amount is ₹100"
      })
    }

    // Create withdrawal request
    const transaction = new Transaction({
      contestantId,
      type: "withdraw",
      amount: Number(amount),
      bankAccountNumber,
      ifscCode,
      status: "pending",
      description: `Withdrawal request for ₹${amount}`
    })

    await transaction.save()

    // Temporarily deduct from balance (will be refunded if rejected)
    contestant.walletBalance -= Number(amount)
    await contestant.save()

    res.status(201).json({
      success: true,
      message: "Withdrawal request submitted. Waiting for admin approval.",
      data: transaction
    })
  } catch (err) {
    console.error("Withdrawal error:", err)
    res.status(500).json({
      success: false,
      message: "Error processing withdrawal request",
      error: err.message
    })
  }
})

// Get all deposit requests (for admin)
router.get("/deposits", async (req, res) => {
  try {
    const deposits = await Transaction.find({ type: "deposit" })
      .populate("contestantId", "playerName phone email")
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      data: deposits,
      total: deposits.length
    })
  } catch (err) {
    console.error("Error fetching deposits:", err)
    res.status(500).json({
      success: false,
      message: "Error fetching deposits",
      error: err.message
    })
  }
})

// Get all withdrawal requests (for admin)
router.get("/withdrawals", async (req, res) => {
  try {
    const withdrawals = await Transaction.find({ type: "withdraw" })
      .populate("contestantId", "playerName phone email")
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      data: withdrawals,
      total: withdrawals.length
    })
  } catch (err) {
    console.error("Error fetching withdrawals:", err)
    res.status(500).json({
      success: false,
      message: "Error fetching withdrawals",
      error: err.message
    })
  }
})

export default router

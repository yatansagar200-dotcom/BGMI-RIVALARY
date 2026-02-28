import express from "express";
import JoinRequest from "../models/JoinRequest.js";
import Contestant from "../models/Contestant.js";
import Tournament from "../models/Tournament.js";
import Result from "../models/Result.js";
import Transaction from "../models/Transaction.js";

const router = express.Router();

// Get all join requests
router.get("/join-requests", async (req, res) => {
  try {
    const joinRequests = await JoinRequest.find().populate("tournamentId").sort({ createdAt: -1 });
    res.json({
      success: true,
      data: joinRequests,
      total: joinRequests.length
    });
  } catch (err) {
    console.error("Error fetching join requests:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching join requests",
      error: err.message
    });
  }
});

// Update join request status
router.put("/join-requests/:id", async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    if (!status || !["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }
    const joinRequest = await JoinRequest.findByIdAndUpdate(
      req.params.id,
      { status, adminNote },
      { new: true }
    );
    res.json({
      success: true,
      message: "Join request updated",
      data: joinRequest
    });
  } catch (err) {
    console.error("Error updating join request:", err);
    res.status(500).json({
      success: false,
      message: "Error updating join request",
      error: err.message
    });
  }
});

// Delete join requests (all or by age)
router.delete("/join-requests", async (req, res) => {
  try {
    const { days, deleteAll } = req.query;
    
    let filter = {};
    
    if (deleteAll === "true") {
      const result = await JoinRequest.deleteMany({});
      return res.json({
        success: true,
        message: `Deleted all ${result.deletedCount} join requests`,
        deletedCount: result.deletedCount
      });
    } else if (days) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
      filter = { createdAt: { $lt: cutoffDate } };
    }
    
    const result = await JoinRequest.deleteMany(filter);
    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} old join requests`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error("Error deleting join requests:", err);
    res.status(500).json({
      success: false,
      message: "Error deleting join requests",
      error: err.message
    });
  }
});

router.post("/login", (req, res) => {
  console.log("Admin login attempt:", req.body);
  
  const { email, password } = req.body;
  
  const adminEmail = "localghost550@gmail.com";
  const adminPass = "@localghost5500";
  
  console.log("Expected credentials:", { adminEmail, adminPass });

  if (email === adminEmail && password === adminPass) {
    console.log("✅ Admin login successful");
    return res.json({ success: true });
  }

  console.log("❌ Admin login failed - invalid credentials");
  res.status(401).json({ success: false, message: "Invalid Admin Credentials 😤" });
});

// Get all contestants
router.get("/contestants", async (req, res) => {
  try {
    const contestants = await Contestant.find().sort({ createdAt: -1 });
    res.json({ 
      success: true, 
      data: contestants,
      total: contestants.length 
    });
  } catch (err) {
    console.error("Error fetching contestants:", err);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching contestants",
      error: err.message 
    });
  }
});

// Delete contestants (all or by age)
router.delete("/contestants", async (req, res) => {
  try {
    const { deleteAll } = req.query;
    
    if (deleteAll === "true") {
      const result = await Contestant.deleteMany({});
      return res.json({
        success: true,
        message: `Deleted all ${result.deletedCount} contestants`,
        deletedCount: result.deletedCount
      });
    }
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    
    const result = await Contestant.deleteMany({
      createdAt: { $lt: cutoffDate },
      walletBalance: 0,
      totalDeposited: 0
    });
    
    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} old inactive contestants`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error("Error deleting contestants:", err);
    res.status(500).json({
      success: false,
      message: "Error deleting contestants",
      error: err.message
    });
  }
});

// Get all contestants with phone numbers and passwords
router.get("/contestants-with-phone", async (req, res) => {
  try {
    const contestants = await Contestant.find({}, "playerName phone email password").sort({ createdAt: -1 });
    
    console.log("=== Password Recovery Data ===");
    contestants.forEach(c => {
      console.log(`Name: ${c.playerName}, Phone: ${c.phone}, Password: ${c.password || 'NOT SET'}`);
    });
    
    res.json({ 
      success: true, 
      data: contestants,
      total: contestants.length 
    });
  } catch (err) {
    console.error("Error fetching contestants:", err);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching contestants",
      error: err.message 
    });
  }
});

// Update contestant password
router.put("/contestants/:id/password", async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 4 characters"
      });
    }

    const contestant = await Contestant.findByIdAndUpdate(
      req.params.id,
      { password: newPassword },
      { new: true }
    );

    if (!contestant) {
      return res.status(404).json({
        success: false,
        message: "Contestant not found"
      });
    }

    res.json({
      success: true,
      message: "Password updated successfully",
      data: { playerName: contestant.playerName, phone: contestant.phone }
    });
  } catch (err) {
    console.error("Error updating password:", err);
    res.status(500).json({
      success: false,
      message: "Error updating password",
      error: err.message
    });
  }
});

// ============ TRANSACTION MANAGEMENT ============

// Get all transactions for a contestant
router.get("/transactions/:contestantId", async (req, res) => {
  try {
    const transactions = await Transaction.find({ contestantId: req.params.contestantId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({
      success: true,
      data: transactions
    });
  } catch (err) {
    console.error("Error fetching transactions:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching transactions",
      error: err.message
    });
  }
});

// Get all deposit requests
router.get("/deposits", async (req, res) => {
  try {
    const deposits = await Transaction.find({ type: "deposit" })
      .populate("contestantId", "playerName phone email")
      .sort({ createdAt: -1 });
    res.json({
      success: true,
      data: deposits,
      total: deposits.length
    });
  } catch (err) {
    console.error("Error fetching deposits:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching deposits",
      error: err.message
    });
  }
});

// Delete old approved/completed deposits
router.delete("/deposits", async (req, res) => {
  try {
    const { deleteAll } = req.query;
    
    if (deleteAll === "true") {
      const result = await Transaction.deleteMany({ type: "deposit" });
      return res.json({
        success: true,
        message: `Deleted all ${result.deletedCount} deposit records`,
        deletedCount: result.deletedCount
      });
    }
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    
    const result = await Transaction.deleteMany({
      type: "deposit",
      status: "approved",
      createdAt: { $lt: cutoffDate }
    });
    
    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} old approved deposits`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error("Error deleting deposits:", err);
    res.status(500).json({
      success: false,
      message: "Error deleting deposits",
      error: err.message
    });
  }
});

// Get all withdrawal requests
router.get("/withdrawals", async (req, res) => {
  try {
    const withdrawals = await Transaction.find({ type: "withdraw" })
      .populate("contestantId", "playerName phone email")
      .sort({ createdAt: -1 });
    res.json({
      success: true,
      data: withdrawals,
      total: withdrawals.length
    });
  } catch (err) {
    console.error("Error fetching withdrawals:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching withdrawals",
      error: err.message
    });
  }
});

// Delete old withdrawal records
router.delete("/withdrawals", async (req, res) => {
  try {
    const { deleteAll } = req.query;
    
    if (deleteAll === "true") {
      const result = await Transaction.deleteMany({ type: "withdraw" });
      return res.json({
        success: true,
        message: `Deleted all ${result.deletedCount} withdrawal records`,
        deletedCount: result.deletedCount
      });
    }
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    
    const result = await Transaction.deleteMany({
      type: "withdraw",
      status: "approved",
      createdAt: { $lt: cutoffDate }
    });
    
    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} old approved withdrawals`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error("Error deleting withdrawals:", err);
    res.status(500).json({
      success: false,
      message: "Error deleting withdrawals",
      error: err.message
    });
  }
});

// Create deposit (user submits deposit request)
router.post("/deposits", async (req, res) => {
  try {
    const { contestantId, amount, paymentScreenshot, transactionId } = req.body;

    if (!contestantId || !amount || !paymentScreenshot) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    const contestant = await Contestant.findById(contestantId);
    if (!contestant) {
      return res.status(404).json({
        success: false,
        message: "Contestant not found"
      });
    }

    const transaction = new Transaction({
      contestantId,
      type: "deposit",
      amount: Number(amount),
      paymentScreenshot,
      upiTransactionId: transactionId || "",
      status: "pending",
      description: `Deposit request for ₹${amount}`
    });

    await transaction.save();

    res.status(201).json({
      success: true,
      message: "Deposit request submitted",
      data: transaction
    });
  } catch (err) {
    console.error("Deposit error:", err);
    res.status(500).json({
      success: false,
      message: "Error submitting deposit",
      error: err.message
    });
  }
});

// Approve or reject deposit
router.put("/deposits/:id", async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    
    console.log("=== Deposit Approval Request ===");
    console.log("Transaction ID:", req.params.id);
    console.log("Status:", status);
    
    if (!status || !["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }

    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      console.error("Transaction not found:", req.params.id);
      return res.status(404).json({
        success: false,
        message: "Transaction not found"
      });
    }

    const contestant = await Contestant.findById(transaction.contestantId);
    if (!contestant) {
      console.error("Contestant not found:", transaction.contestantId);
      return res.status(404).json({
        success: false,
        message: "Contestant not found"
      });
    }

    console.log("Found contestant:", {
      id: contestant._id,
      name: contestant.playerName,
      currentBalance: contestant.walletBalance
    });

    // If approving, add to wallet balance
    if (status === "approved") {
      const amountToAdd = Number(transaction.amount);
      const oldBalance = contestant.walletBalance || 0;
      const oldTotalDeposited = contestant.totalDeposited || 0;
      
      contestant.walletBalance = oldBalance + amountToAdd;
      contestant.totalDeposited = oldTotalDeposited + amountToAdd;
      
      // Save contestant first to ensure wallet is updated
      await contestant.save();
      
      console.log("✅ Wallet Updated Successfully!");
      console.log("  Amount added:", amountToAdd);
      console.log("  Old balance:", oldBalance);
      console.log("  New balance:", contestant.walletBalance);
    }

    // Update transaction status
    transaction.status = status;
    transaction.adminNote = adminNote || "";
    
    // Save transaction after contestant to ensure both are updated
    await transaction.save();

    console.log("Transaction status updated to:", status);
    
    // Fetch fresh contestant data to confirm
    const updatedContestant = await Contestant.findById(transaction.contestantId);
    console.log("Final wallet balance:", updatedContestant.walletBalance);

    res.json({
      success: true,
      message: `Deposit ${status}`,
      data: transaction
    });
  } catch (err) {
    console.error("❌ Error updating deposit:", err);
    res.status(500).json({
      success: false,
      message: "Error updating deposit",
      error: err.message
    });
  }
});

// Create withdrawal request
router.post("/withdrawals", async (req, res) => {
  try {
    const { contestantId, amount, upiId } = req.body;

    if (!contestantId || !amount) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    const contestant = await Contestant.findById(contestantId);
    if (!contestant) {
      return res.status(404).json({
        success: false,
        message: "Contestant not found"
      });
    }

    if (contestant.walletBalance < amount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance"
      });
    }

    // Deduct from balance immediately
    contestant.walletBalance -= amount;
    await contestant.save();

    const transaction = new Transaction({
      contestantId,
      type: "withdraw",
      amount: Number(amount),
      bankAccountNumber: upiId || "",
      status: "pending",
      description: `Withdrawal request for ₹${amount}`
    });

    await transaction.save();

    res.status(201).json({
      success: true,
      message: "Withdrawal request submitted",
      data: transaction
    });
  } catch (err) {
    console.error("Withdrawal error:", err);
    res.status(500).json({
      success: false,
      message: "Error submitting withdrawal",
      error: err.message
    });
  }
});

// Approve or reject withdrawal
router.put("/withdrawals/:id", async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    
    if (!status || !["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }

    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found"
      });
    }

    const contestant = await Contestant.findById(transaction.contestantId);
    if (!contestant) {
      return res.status(404).json({
        success: false,
        message: "Contestant not found"
      });
    }

    // If rejecting, refund the amount
    if (status === "rejected") {
      contestant.walletBalance += transaction.amount;
      await contestant.save();
    } else {
      // If approved, update total spent
      contestant.totalSpent += transaction.amount;
      await contestant.save();
    }

    transaction.status = status;
    transaction.adminNote = adminNote || "";
    await transaction.save();

    res.json({
      success: true,
      message: `Withdrawal ${status}`,
      data: transaction
    });
  } catch (err) {
    console.error("Error updating withdrawal:", err);
    res.status(500).json({
      success: false,
      message: "Error updating withdrawal",
      error: err.message
    });
  }
});

// ============ TOURNAMENTS & RESULTS MANAGEMENT ============

// Delete old tournaments
router.delete("/tournaments", async (req, res) => {
  try {
    const { deleteAll } = req.query;
    
    if (deleteAll === "true") {
      const result = await Tournament.deleteMany({});
      return res.json({
        success: true,
        message: `Deleted all ${result.deletedCount} tournaments`,
        deletedCount: result.deletedCount
      });
    }
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    
    const result = await Tournament.deleteMany({
      status: "Completed",
      createdAt: { $lt: cutoffDate }
    });
    
    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} old completed tournaments`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error("Error deleting tournaments:", err);
    res.status(500).json({
      success: false,
      message: "Error deleting tournaments",
      error: err.message
    });
  }
});

// Delete old results
router.delete("/results", async (req, res) => {
  try {
    const { deleteAll } = req.query;
    
    if (deleteAll === "true") {
      const result = await Result.deleteMany({});
      return res.json({
        success: true,
        message: `Deleted all ${result.deletedCount} results`,
        deletedCount: result.deletedCount
      });
    }
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    
    const result = await Result.deleteMany({
      createdAt: { $lt: cutoffDate }
    });
    
    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} old results`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error("Error deleting results:", err);
    res.status(500).json({
      success: false,
      message: "Error deleting results",
      error: err.message
    });
  }
});

// ============ CLEAR ALL DATA ============

// Clear all data (emergency reset)
router.delete("/clear-all", async (req, res) => {
  try {
    const { confirm } = req.body;
    
    if (confirm !== "YES_DELETE_ALL") {
      return res.status(400).json({
        success: false,
        message: "Please send { confirm: 'YES_DELETE_ALL' } to confirm deletion"
      });
    }

    const joinRequests = await JoinRequest.deleteMany({});
    const transactions = await Transaction.deleteMany({});
    const results = await Result.deleteMany({});
    const tournaments = await Tournament.deleteMany({});

    res.json({
      success: true,
      message: `Cleared all data: ${joinRequests.deletedCount} join requests, ${transactions.deletedCount} transactions, ${results.deletedCount} results, ${tournaments.deletedCount} tournaments`,
      deletedCounts: {
        joinRequests: joinRequests.deletedCount,
        transactions: transactions.deletedCount,
        results: results.deletedCount,
        tournaments: tournaments.deletedCount
      }
    });
  } catch (err) {
    console.error("Error clearing data:", err);
    res.status(500).json({
      success: false,
      message: "Error clearing data",
      error: err.message
    });
  }
});

export default router;

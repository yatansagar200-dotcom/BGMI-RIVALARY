import express from "express";
import bcrypt from "bcryptjs";
import JoinRequest from "../models/JoinRequest.js";
import Contestant from "../models/Contestant.js";
import Tournament from "../models/Tournament.js";
import Result from "../models/Result.js";

const router = express.Router();

// Get join requests for a player
router.get("/join-requests", async (req, res) => {
  try {
    const { playerName, bgmiId, phone } = req.query;
    const joinRequests = await JoinRequest.find({ playerName, bgmiId, phone })
      .populate("tournamentId")
      .sort({ createdAt: -1 });
    res.json({
      success: true,
      data: joinRequests,
    });
  } catch (err) {
    console.error("Error fetching join requests:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching join requests",
      error: err.message,
    });
  }
});

// Join tournament (create join request)
router.post("/tournament/join", async (req, res) => {
  try {
    const { playerName, bgmiId, phone, tournamentId, paymentScreenshot } = req.body;

    if (!playerName || !bgmiId || !phone || !tournamentId || !paymentScreenshot) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    // Check if tournament exists
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found"
      });
    }

    // Create join request
    const joinRequest = new JoinRequest({
      playerName,
      bgmiId,
      phone,
      tournamentId,
      paymentScreenshot,
      status: "pending"
    });
    await joinRequest.save();

    res.json({
      success: true,
      message: "Join request submitted. Await admin approval.",
      data: joinRequest
    });
  } catch (err) {
    console.error("Tournament join error:", err);
    res.status(500).json({
      success: false,
      message: "Error joining tournament",
      error: err.message
    });
  }
});

// Login route for contestants
router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Phone and password are required"
      });
    }

    // Find contestant by phone
    const contestant = await Contestant.findOne({ phone });

    if (!contestant) {
      return res.status(401).json({
        success: false,
        message: "Invalid phone or password"
      });
    }

    // Check if password is set in database
    const storedPassword = contestant.password;
    
    // If no password in database, allow login (backward compatibility for old users)
    // This handles users who registered before password was implemented
    if (!storedPassword || storedPassword === "" || storedPassword === null || storedPassword === undefined) {
      console.log(`Login allowed for user ${contestant.playerName} (no password set - backward compatibility)`);
      return res.json({
        success: true,
        data: {
          _id: contestant._id,
          playerName: contestant.playerName,
          phone: contestant.phone,
          email: contestant.email,
          bgmiId: contestant.bgmiId,
          walletBalance: contestant.walletBalance || 0
        }
      });
    }

    // Check password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, storedPassword);
    
    // Also try plain text comparison for backward compatibility
    const isPlainTextMatch = storedPassword === password || storedPassword === password.trim();
    
    if (!isPasswordValid && !isPlainTextMatch) {
      console.log(`Login failed for ${phone}: password mismatch`);
      return res.status(401).json({
        success: false,
        message: "Invalid phone or password"
      });
    }

    // Return contestant data (without password)
    console.log(`Login successful for ${contestant.playerName}`);
    res.json({
      success: true,
      data: {
        _id: contestant._id,
        playerName: contestant.playerName,
        phone: contestant.phone,
        email: contestant.email,
        bgmiId: contestant.bgmiId,
        walletBalance: contestant.walletBalance || 0
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      success: false,
      message: "Error during login",
      error: err.message
    });
  }
});

// Register - NOW SAVES PASSWORD TO DATABASE
router.post("/register", async (req, res) => {
  try {
    const { playerName, phone, email, password } = req.body;

    // Validation - now includes password
    if (!playerName || !phone || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "All fields are required" 
      });
    }

    // Check if contestant already exists with same email or phone
    const existingContestant = await Contestant.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingContestant) {
      return res.status(409).json({
        success: false,
        message: "This Email or Mobile Number is already registered"
      });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new contestant - NOW INCLUDES HASHED PASSWORD
    const newContestant = new Contestant({
      playerName,
      phone,
      email,
      password: hashedPassword  // Saving hashed password to database
    });

    await newContestant.save();

    console.log("✅ New contestant registered:", {
      playerName,
      phone,
      email
    });

    res.status(201).json({
      success: true,
      message: "Registration successful 🔥",
      data: {
        _id: newContestant._id,
        playerName: newContestant.playerName,
        phone: newContestant.phone,
        email: newContestant.email
      }
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({
      success: false,
      message: "Something went wrong during registration",
      error: err.message
    });
  }
});

// Get last 10 results
router.get("/results", async (req, res) => {
  try {
    const results = await Result.find().sort({ createdAt: -1 }).limit(10)
    res.json({
      success: true,
      data: results
    })
  } catch (err) {
    console.error("Error fetching results:", err)
    res.status(500).json({
      success: false,
      message: "Error fetching results",
      error: err.message
    })
  }
})

// Get contestant profile by ID
router.get("/profile/:id", async (req, res) => {
  try {
    const contestant = await Contestant.findById(req.params.id)
    if (!contestant) {
      return res.status(404).json({
        success: false,
        message: "Contestant not found"
      })
    }
    res.json({
      success: true,
      data: contestant
    })
  } catch (err) {
    console.error("Error fetching profile:", err)
    res.status(500).json({
      success: false,
      message: "Error fetching profile",
      error: err.message
    })
  }
})

// Get contestant wallet by ID
router.get("/wallet/:id", async (req, res) => {
  try {
    const contestant = await Contestant.findById(req.params.id)
    if (!contestant) {
      return res.status(404).json({
        success: false,
        message: "Contestant not found"
      })
    }
    res.json({
      success: true,
      data: {
        walletBalance: contestant.walletBalance || 0,
        pendingBalance: contestant.pendingBalance || 0,
        totalDeposited: contestant.totalDeposited || 0,
        totalWon: contestant.totalWon || 0,
        totalSpent: contestant.totalSpent || 0,
        totalWithdrawn: contestant.totalWithdrawn || 0
      }
    })
  } catch (err) {
    console.error("Error fetching wallet:", err)
    res.status(500).json({
      success: false,
      message: "Error fetching wallet",
      error: err.message
    })
  }
})

// Update contestant profile
router.put("/profile/:id", async (req, res) => {
  try {
    const { playerName, bgmiId, bio, avatar } = req.body
    
    const contestant = await Contestant.findById(req.params.id)
    if (!contestant) {
      return res.status(404).json({
        success: false,
        message: "Contestant not found"
      })
    }

    // Update fields
    if (playerName) contestant.playerName = playerName
    if (bgmiId !== undefined) contestant.bgmiId = bgmiId
    if (bio !== undefined) contestant.bio = bio
    if (avatar !== undefined) contestant.avatar = avatar

    await contestant.save()

    res.json({
      success: true,
      message: "Profile updated successfully!",
      data: contestant
    })
  } catch (err) {
    console.error("Error updating profile:", err)
    res.status(500).json({
      success: false,
      message: "Error updating profile",
      error: err.message
    })
  }
})

export default router

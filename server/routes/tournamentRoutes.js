import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import Tournament from "../models/Tournament.js";
import Result from "../models/Result.js";

const router = express.Router();

// Get __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for tournament images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'))
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'tournament-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)
    if (extname && mimetype) {
      return cb(null, true)
    }
    cb(new Error('Only image files are allowed!'))
  }
})

// Upload tournament background image
router.post("/upload-image", upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file uploaded"
      });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        filename: req.file.filename,
        path: imageUrl,
        url: imageUrl
      }
    });
  } catch (err) {
    console.error("Image upload error:", err);
    res.status(500).json({
      success: false,
      message: "Error uploading image",
      error: err.message
    });
  }
});

// Helper function to calculate tournament status based on date and time
const calculateTournamentStatus = (tournament) => {
  const now = new Date();
  
  // Parse tournament date and time (format: YYYY-MM-DD HH:mm)
  const [hours, minutes] = tournament.time.split(':');
  const tournamentDateTime = new Date(tournament.date);
  tournamentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  // Add 2 hours to the start time for "Live" status (tournament runs for 2 hours)
  const liveEndTime = new Date(tournamentDateTime.getTime() + (2 * 60 * 60 * 1000));
  
  if (now < tournamentDateTime) {
    return "Upcoming";
  } else if (now >= tournamentDateTime && now < liveEndTime) {
    return "Live";
  } else {
    return "Completed";
  }
};

// Auto-update tournament statuses based on date/time
const autoUpdateTournamentStatuses = async () => {
  try {
    const tournaments = await Tournament.find({});
    let updatedCount = 0;
    
    for (const tournament of tournaments) {
      const calculatedStatus = calculateTournamentStatus(tournament);
      
      // Only update if status is different
      if (tournament.status !== calculatedStatus) {
        tournament.status = calculatedStatus;
        await tournament.save();
        updatedCount++;
        console.log(`Tournament "${tournament.name}" status updated to: ${calculatedStatus}`);
      }
    }
    
    return updatedCount;
  } catch (err) {
    console.error("Error auto-updating tournament statuses:", err);
    return 0;
  }
};

// Get all tournaments, with optional status filtering and auto-update
router.get("/", async (req, res) => {
  try {
    const { status, autoUpdate } = req.query;
    
    // Auto-update statuses if requested (default: true)
    if (autoUpdate !== 'false') {
      await autoUpdateTournamentStatuses();
    }
    
    const filter = status ? { status: { $in: status.split(',') } } : {};
    const tournaments = await Tournament.find(filter).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: tournaments,
      total: tournaments.length,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching tournaments",
      error: err.message,
    });
  }
});

// Manual endpoint to trigger status update
router.post("/update-statuses", async (req, res) => {
  try {
    const updatedCount = await autoUpdateTournamentStatuses();
    res.json({
      success: true,
      message: `Updated ${updatedCount} tournament statuses`,
      updatedCount
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error updating tournament statuses",
      error: err.message,
    });
  }
});

// Create Tournament
router.post("/", async (req, res) => {
  try {
    let { name, description, date, time, type, entryFee, prizePool, maxParticipants, backgroundImage } = req.body;

    // Parse numeric fields
    entryFee = Number(entryFee);
    prizePool = Number(prizePool);
    maxParticipants = Number(maxParticipants);

    if (!name || !date || !time || !type || isNaN(entryFee) || isNaN(prizePool) || isNaN(maxParticipants)) {
      return res.status(400).json({
        success: false,
        message: "All fields are required and must be valid"
      });
    }

    const tournament = new Tournament({
      name,
      description,
      date,
      time,
      type,
      entryFee,
      prizePool,
      maxParticipants,
      backgroundImage: backgroundImage || "",
      status: "Upcoming"
    });

    await tournament.save();
    res.status(201).json({
      success: true,
      message: "Tournament created successfully",
      data: tournament
    });
  } catch (err) {
    console.error("Tournament creation error:", err);
    res.status(500).json({
      success: false,
      message: "Error creating tournament",
      error: err.message
    });
  }
});

// Update tournament status and winner info
router.put("/:id", async (req, res) => {
  try {
    const { status, winner, runnerUp, thirdPlace } = req.body;
    const tournament = await Tournament.findByIdAndUpdate(
      req.params.id,
      { status, winner, runnerUp, thirdPlace },
      { new: true }
    );
    res.json({
      success: true,
      message: "Tournament updated",
      data: tournament
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error updating tournament",
      error: err.message
    });
  }
});

// Delete single tournament
router.delete("/:id", async (req, res) => {
  try {
    const tournament = await Tournament.findByIdAndDelete(req.params.id);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found"
      });
    }
    res.json({
      success: true,
      message: "Tournament deleted successfully",
      data: tournament
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error deleting tournament",
      error: err.message
    });
  }
});

// Add match result
router.post("/results", async (req, res) => {
  try {
    const { tournament, date, winner, runnerUp, thirdPlace, totalParticipants, prizeDistributed, winnerPrize, runnerUpPrize, thirdPrize, matchType } = req.body;

    const result = new Result({
      tournament,
      date,
      winner,
      runnerUp,
      thirdPlace,
      totalParticipants,
      prizeDistributed,
      winnerPrize,
      runnerUpPrize,
      thirdPrize,
      matchType
    });

    await result.save();
    res.status(201).json({
      success: true,
      message: "Result added successfully",
      data: result
    });
  } catch (err) {
    console.error("Result error:", err);
    res.status(500).json({
      success: false,
      message: "Error adding result",
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

export default router;

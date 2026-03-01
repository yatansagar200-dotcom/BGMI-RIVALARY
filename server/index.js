import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import mongoose from "mongoose"
import path from "path"
import { fileURLToPath } from "url"
import multer from "multer"
import adminRoutes from "./routes/adminRoutes.js"
import contestantRoutes from "./routes/contestantRoutes.js"
import tournamentRoutes from "./routes/tournamentRoutes.js"
import transactionRoutes from "./routes/transactionRoutes.js"
import Tournament from "./models/Tournament.js"

dotenv.config()

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Determine the correct paths for different environments
const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER;

// For Render (production), the structure is different
// /opt/render/project/src/server -> /opt/render/project/src/client/dist
const clientDistPath = isProduction 
  ? path.join(__dirname, '../client/dist')
  : path.join(__dirname, '../client/dist');

console.log('Environment:', isProduction ? 'Production (Render)' : 'Development');
console.log('Client dist path:', clientDistPath);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads'))
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
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

// Helper function to calculate tournament status based on date and time
const calculateTournamentStatus = (tournament) => {
  const now = new Date();
  
  // Parse tournament date and time (format: YYYY-MM-DD HH:mm)
  if (!tournament.time) return "Upcoming";
  
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

// Auto-update tournament statuses every minute
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
    
    if (updatedCount > 0) {
      console.log(`Updated ${updatedCount} tournament status(s)`);
    }
  } catch (err) {
    console.error("Error auto-updating tournament statuses:", err);
  }
};

// Start the scheduler after MongoDB connection
let schedulerStarted = false;

const app = express()
app.use(cors())
app.use(express.json())

// Serve static files for uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// Make upload middleware available to routes
app.use((req, res, next) => {
  req.upload = upload
  next()
})

app.use("/api/admin", adminRoutes)
app.use("/api/contestants", contestantRoutes)
app.use("/api/tournaments", tournamentRoutes)
app.use("/api/transactions", transactionRoutes)

// Serve static files from React build in production

// Handle React routing, return index.html for unknown routes
// Express 5 requires middleware approach instead of app.get("*")
app.use((req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  })
})

app.get("/", (req, res) => {
  res.send({ 
    message: "BGMI Backend Running", 
    version: "2.0.0",
    features: ["wallet", "profile", "transactions", "auto-status-update"]
  })
})

const PORT = process.env.PORT || 5000
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/bgmi_tournament"

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected")
    
    // Start the auto-update scheduler
    if (!schedulerStarted) {
      schedulerStarted = true;
      
      // Run immediately on startup
      autoUpdateTournamentStatuses();
      
      // Then run every minute (60000 ms)
      setInterval(autoUpdateTournamentStatuses, 60000);
      
      console.log("Tournament status auto-update scheduler started (every 1 minute)");
    }
    
    app.listen(PORT, () =>
      console.log(`Server running on port ${PORT}`)
    )
  })
  .catch(err => {
    console.error("MongoDB Connection Error:", err.message)
    process.exit(1)
  })

import express from "express";
import cors from "cors";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Root route
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "EcoShift Backend Running 🚀",
  });
});

// Health check route (useful for mobile apps and uptime checks)
app.get("/health", (req, res) => {
  res.json({
    healthy: true,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler (prevents server crashes)
app.use((err, req, res, next) => {
  console.error("❌ SERVER ERROR:", err);
  res.status(500).json({
    error: "Internal server error",
    details: err.message,
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ EcoShift backend running on port ${PORT}`);
});

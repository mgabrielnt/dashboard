require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});

pool.query("SELECT NOW()")
  .then((result) => {
    console.log("Database connected successfully. Server time:", result.rows[0].now);
  })
  .catch((error) => {
    console.error("Database connection error:", error.message);
  });

const { authenticate, adminOnly } = require("./middleware/auth");

const authRoutes = require("./routes/authRoutes");
const usersRoutes = require("./routes/usersRoutes");
const BKIRoutes = require("./routes/BKIRoutes");
const SCIRoutes = require("./routes/SCIRoutes");
const SIRoutes = require("./routes/SIRoutes");
const entityRoutes = require("./routes/entityRoutes");
const teamRoutes = require("./routes/teamRoutes");
const piechart = require("./routes/pieRoutes");
const linechart = require("./routes/lineRoutes");
const barchartbki = require("./routes/barbkiRoutes");
const barchartsci = require("./routes/barsciRoutes");
const barchartsi = require("./routes/barsiRoutes");
const calendarRoutes = require("./routes/calenderRoutes");
const profileRoutes = require("./routes/profileRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", authenticate, adminOnly, usersRoutes);
app.use("/api/BKI", authenticate, BKIRoutes);
app.use("/api/SCI", authenticate, SCIRoutes);
app.use("/api/SI", authenticate, SIRoutes);
app.use("/api/entities", authenticate, entityRoutes);
app.use("/api/team", authenticate, adminOnly, teamRoutes);
app.use("/api/pie", authenticate, piechart);
app.use("/api/line", authenticate, linechart);
app.use("/api/barbki", authenticate, barchartbki);
app.use("/api/barsci", authenticate, barchartsci);
app.use("/api/barsi", authenticate, barchartsi);
app.use("/api/calendar", authenticate, calendarRoutes);
app.use("/api/profile", authenticate, profileRoutes);
app.use("/api/chatbot", chatbotRoutes);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

if (isProduction) {
  const clientBuildPath = path.join(__dirname, "..", "build");

  app.get("/static/js/:file", (req, res, next) => {
    const filePath = path.join(clientBuildPath, "static", "js", req.params.file);
    fs.readFile(filePath, "utf8", (error, source) => {
      if (error) return next();
      const normalizedSource = source.replace(/http:\/\/localhost:5000/g, "");
      res.type("application/javascript").send(normalizedSource);
    });
  });

  app.use(express.static(clientBuildPath));

  app.get("*", (req, res) => {
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ message: "API route not found" });
    }
    return res.sendFile(path.join(clientBuildPath, "index.html"));
  });
}

app.use((err, req, res, next) => {
  console.error("Global error handler caught:", err.stack || err.message);
  res.status(500).json({ message: "Something went wrong!", error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = pool;

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "dashboard_demo_secret_change_me";
const hasDatabase = Boolean(process.env.DATABASE_URL || process.env.DB_HOST);

if (hasDatabase) {
  require("./server");
} else {
  const allowedOrigins = (process.env.CORS_ORIGIN || "*")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(cors({
    origin(origin, callback) {
      if (allowedOrigins.includes("*") || !origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  }));

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  const users = new Map();
  const sessions = new Map();

  const demoAdmin = {
    id: 1,
    name: "Demo Admin",
    email: "admin@dashboard.demo",
    passwordHash: bcrypt.hashSync("admin12345", 10),
    role: "admin",
    profile_picture: null,
  };

  users.set(demoAdmin.email, demoAdmin);

  const createToken = (user) => {
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "1d" });
    sessions.set(token, user.email);
    return token;
  };

  const publicUser = (user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    profile_picture: user.profile_picture || null,
    phone: user.phone || "",
    address: user.address || "",
    department: user.department || "",
    job_title: user.job_title || "",
    bio: user.bio || "",
  });

  const requireAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token || !sessions.has(token)) {
      return res.status(401).json({ message: "Authentication token missing or invalid" });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const email = sessions.get(token) || decoded.email;
      const user = users.get(email);
      if (!user) return res.status(401).json({ message: "User not found" });
      req.user = user;
      return next();
    } catch (error) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  };

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", mode: "demo-no-database", timestamp: new Date().toISOString() });
  });

  app.post("/api/auth/register", async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    if (users.has(normalizedEmail)) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const user = {
      id: users.size + 1,
      name,
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 10),
      role: "admin",
      profile_picture: null,
    };

    users.set(normalizedEmail, user);
    const token = createToken(user);
    return res.status(201).json({ message: "User registered successfully", user: publicUser(user), token });
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const normalizedEmail = String(email || "").toLowerCase().trim();
    const user = users.get(normalizedEmail);

    if (!user || !(await bcrypt.compare(password || "", user.passwordHash))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = createToken(user);
    return res.json({ message: "Login successful", user: publicUser(user), token });
  });

  app.post("/api/auth/google-auth", (req, res) => {
    const googleData = req.body.googleData || {};
    const email = String(googleData.email || "google-user@dashboard.demo").toLowerCase().trim();
    const user = users.get(email) || {
      id: users.size + 1,
      name: googleData.name || "Google Demo User",
      email,
      passwordHash: "",
      role: "admin",
      profile_picture: googleData.picture || null,
    };
    users.set(email, user);
    const token = createToken(user);
    return res.json({ message: "Google authentication successful", user: publicUser(user), token });
  });

  app.get("/api/auth/profile", requireAuth, (req, res) => {
    res.json({ user: publicUser(req.user) });
  });

  app.put("/api/auth/profile", requireAuth, (req, res) => {
    Object.assign(req.user, req.body || {});
    users.set(req.user.email, req.user);
    res.json({ message: "Profile updated successfully", user: publicUser(req.user) });
  });

  app.post("/api/auth/logout", (req, res) => {
    const token = req.body.token || req.headers.authorization?.split(" ")[1];
    if (token) sessions.delete(token);
    res.json({ message: "Logged out successfully" });
  });

  app.get("/api/profile", requireAuth, (req, res) => {
    res.json(publicUser(req.user));
  });

  app.put("/api/profile", requireAuth, (req, res) => {
    Object.assign(req.user, req.body || {});
    users.set(req.user.email, req.user);
    res.json({ message: "Profile updated successfully", user: publicUser(req.user) });
  });

  app.get("/api/users", requireAuth, (req, res) => {
    res.json(Array.from(users.values()).map(publicUser));
  });

  app.get("/api/team", requireAuth, (req, res) => {
    const data = Array.from(users.values()).map(publicUser);
    res.json({ data, pagination: { total: data.length, pages: 1, page: 1, limit: data.length } });
  });

  const emptyArrayRoutes = [
    "/api/BKI", "/api/SCI", "/api/SI", "/api/entities", "/api/pie", "/api/line",
    "/api/barbki", "/api/barsci", "/api/barsi", "/api/calendar",
  ];

  emptyArrayRoutes.forEach((route) => {
    app.get(route, requireAuth, (req, res) => res.json([]));
    app.post(route, requireAuth, (req, res) => res.status(201).json({ message: "Demo mode: data was accepted but not persisted", data: req.body }));
    app.put(`${route}/:id`, requireAuth, (req, res) => res.json({ message: "Demo mode: data was updated but not persisted", data: req.body }));
    app.delete(`${route}/:id`, requireAuth, (req, res) => res.json({ message: "Demo mode: data was deleted but not persisted" }));
  });

  app.post("/api/chatbot", (req, res) => {
    res.json({ reply: "Demo mode aktif. Hubungkan PostgreSQL untuk jawaban berbasis data asli." });
  });

  app.get("/api/*", (req, res) => {
    res.json([]);
  });

  app.listen(PORT, () => {
    console.log(`Demo backend without database running on port ${PORT}`);
  });
}

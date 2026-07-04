require("dotenv").config();

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "dashboard_demo_secret_change_me";

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const demoAdmin = {
  id: 1,
  name: "Demo Admin",
  email: "admin@dashboard.demo",
  role: "admin",
  profile_picture: null,
  phone: "",
  address: "",
  department: "Executive",
  job_title: "Administrator",
  bio: "Demo account",
};

const users = new Map([[demoAdmin.email, demoAdmin]]);

const publicUser = (user = demoAdmin) => ({
  id: user.id || 1,
  name: user.name || "Demo Admin",
  email: user.email || "admin@dashboard.demo",
  role: user.role || "admin",
  profile_picture: user.profile_picture || null,
  phone: user.phone || "",
  address: user.address || "",
  department: user.department || "",
  job_title: user.job_title || "",
  bio: user.bio || "",
});

const makeToken = (user) => jwt.sign(publicUser(user), JWT_SECRET, { expiresIn: "7d" });

const requireAuth = (req, res, next) => {
  const raw = req.headers.authorization || "";
  const token = raw.startsWith("Bearer ") ? raw.slice(7) : raw;

  if (!token) return res.status(401).json({ message: "Authentication token missing" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.get(decoded.email) || publicUser(decoded);
    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

const stats = {
  bki: { value: 0, increase: "+0%", progress: "0.5" },
  sci: { value: 0, increase: "+0%", progress: "0.5" },
  si: { value: 0, increase: "+0%", progress: "0.5" },
  konsol: { value: 0, increase: "+0%", progress: "0.5" },
};

const periods = [
  { year: new Date().getFullYear(), available_months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
];

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", mode: "demo", timestamp: new Date().toISOString() });
});

app.post("/api/auth/login", (req, res) => {
  const email = String(req.body.email || "").toLowerCase().trim();
  const password = String(req.body.password || "");

  if (email !== "admin@dashboard.demo" || password !== "admin12345") {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = makeToken(demoAdmin);
  return res.json({ message: "Login successful", user: publicUser(demoAdmin), token });
});

app.post("/api/auth/register", (req, res) => {
  const email = String(req.body.email || "").toLowerCase().trim();
  const user = {
    ...demoAdmin,
    id: users.size + 1,
    name: req.body.name || "Demo User",
    email: email || `demo${users.size + 1}@dashboard.demo`,
  };
  users.set(user.email, user);
  res.status(201).json({ message: "User registered successfully", user: publicUser(user), token: makeToken(user) });
});

app.post("/api/auth/google-auth", (req, res) => {
  const data = req.body.googleData || {};
  const user = {
    ...demoAdmin,
    id: users.size + 1,
    name: data.name || "Google Demo User",
    email: String(data.email || "google@dashboard.demo").toLowerCase().trim(),
    profile_picture: data.picture || null,
  };
  users.set(user.email, user);
  res.json({ message: "Google authentication successful", user: publicUser(user), token: makeToken(user) });
});

app.get("/api/auth/profile", requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));
app.put("/api/auth/profile", requireAuth, (req, res) => res.json({ message: "Profile updated successfully", user: publicUser({ ...req.user, ...req.body }) }));
app.post("/api/auth/logout", (req, res) => res.json({ message: "Logged out successfully" }));

app.get("/api/profile", requireAuth, (req, res) => res.json(publicUser(req.user)));
app.put("/api/profile", requireAuth, (req, res) => res.json({ message: "Profile updated successfully", user: publicUser({ ...req.user, ...req.body }) }));

app.get("/api/team", requireAuth, (req, res) => {
  const data = Array.from(users.values()).map(publicUser);
  res.json({ data, pagination: { total: data.length, pages: 1, page: 1, limit: 10 } });
});
app.post("/api/team", requireAuth, (req, res) => res.status(201).json({ message: "Team member created successfully", user: publicUser(req.body) }));
app.put("/api/team/:id", requireAuth, (req, res) => res.json({ message: "Team member updated successfully", data: req.body }));
app.delete("/api/team/:id", requireAuth, (req, res) => res.json({ message: "Team member deleted successfully" }));

app.get("/api/calendar/count", requireAuth, (req, res) => res.json({ count: 0 }));
app.get("/api/entities/totals-with-trends", requireAuth, (req, res) => res.json(stats));
app.get("/api/line/available-periods", requireAuth, (req, res) => res.json(periods));

const emptyRoutes = ["/api/users", "/api/BKI", "/api/SCI", "/api/SI", "/api/entities", "/api/pie", "/api/line", "/api/barbki", "/api/barsci", "/api/barsi", "/api/calendar"];
emptyRoutes.forEach((route) => {
  app.get(route, requireAuth, (req, res) => res.json([]));
  app.post(route, requireAuth, (req, res) => res.status(201).json({ message: "Demo data accepted", data: req.body }));
  app.put(`${route}/:id`, requireAuth, (req, res) => res.json({ message: "Demo data updated", data: req.body }));
  app.delete(`${route}/:id`, requireAuth, (req, res) => res.json({ message: "Demo data deleted" }));
});

app.post("/api/chatbot", (req, res) => res.json({ reply: "Demo mode aktif. Hubungkan PostgreSQL untuk data asli." }));
app.get("/api/*", requireAuth, (req, res) => res.json([]));

app.listen(PORT, () => {
  console.log(`Stable demo backend running on port ${PORT}`);
});

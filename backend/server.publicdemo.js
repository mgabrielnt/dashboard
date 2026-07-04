const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const admin = {
  id: 1,
  name: "Demo Admin",
  email: "admin@dashboard.demo",
  role: "admin",
  profile_picture: null,
  phone: "+62 812-0000-0000",
  address: "Jakarta, Indonesia",
  department: "Executive",
  job_title: "Dashboard Administrator",
  bio: "Demo administrator account",
};

const year = new Date().getFullYear();
const months = Array.from({ length: 12 }, (_, i) => i + 1);
const monthly = months.map((bulan, i) => ({
  year,
  bulan,
  bki: 1800000000 + i * 165000000,
  sci: 1250000000 + i * 138000000,
  si: 980000000 + i * 97000000,
}));

const sum = (key) => monthly.reduce((total, item) => total + item[key], 0);
const periods = [{ year, available_months: months }, { year: year - 1, available_months: months }];
const stats = {
  bki: { value: sum("bki"), increase: "+18.4%", progress: "0.78" },
  sci: { value: sum("sci"), increase: "+14.7%", progress: "0.69" },
  si: { value: sum("si"), increase: "+11.2%", progress: "0.61" },
  konsol: { value: 4200000000, increase: "+9.8%", progress: "0.55" },
};
const pie = [
  { id: "BKI", label: "BKI", value: stats.bki.value },
  { id: "SCI", label: "SCI", value: stats.sci.value },
  { id: "SI", label: "SI", value: stats.si.value },
  { id: "KONSOL", label: "KONSOL", value: stats.konsol.value },
];
const team = [
  admin,
  { id: 2, name: "Nadia Putri", email: "nadia@dashboard.demo", role: "manager", profile_picture: null, phone: "+62 812-1000-1000", address: "Jakarta", department: "BKI", job_title: "BKI Manager", bio: "Demo manager" },
  { id: 3, name: "Raka Pratama", email: "raka@dashboard.demo", role: "user", profile_picture: null, phone: "+62 812-2000-2000", address: "Surabaya", department: "SCI", job_title: "SCI Analyst", bio: "Demo analyst" },
];
const events = [
  { id: 1, title: "Quarterly BKI Review", start: `${year}-07-15`, end: `${year}-07-15`, description: "Demo board review" },
  { id: 2, title: "SCI Planning Session", start: `${year}-08-05`, end: `${year}-08-05`, description: "Demo planning agenda" },
  { id: 3, title: "SI Monthly Report", start: `${year}-09-10`, end: `${year}-09-10`, description: "Demo reporting checkpoint" },
];

app.get("/api/health", (req, res) => res.json({ status: "ok", mode: "public-demo" }));
app.post("/api/auth/login", (req, res) => res.json({ message: "Login successful", user: admin, token: "demo-token" }));
app.post("/api/auth/register", (req, res) => res.status(201).json({ message: "User registered successfully", user: { ...admin, name: req.body.name || admin.name, email: req.body.email || admin.email }, token: "demo-token" }));
app.post("/api/auth/google-auth", (req, res) => res.json({ message: "Google authentication successful", user: admin, token: "demo-token" }));
app.get("/api/auth/profile", (req, res) => res.json({ user: admin }));
app.put("/api/auth/profile", (req, res) => res.json({ message: "Profile updated successfully", user: { ...admin, ...req.body } }));
app.post("/api/auth/logout", (req, res) => res.json({ message: "Logged out successfully" }));
app.get("/api/profile", (req, res) => res.json(admin));
app.put("/api/profile", (req, res) => res.json({ message: "Profile updated successfully", user: { ...admin, ...req.body } }));

app.get("/api/team", (req, res) => res.json({ data: team, pagination: { total: team.length, pages: 1, page: 1, limit: 10 } }));
app.post("/api/team", (req, res) => res.status(201).json({ message: "Team member created successfully", user: { id: team.length + 1, ...req.body } }));
app.put("/api/team/:id", (req, res) => res.json({ message: "Team member updated successfully", data: req.body }));
app.delete("/api/team/:id", (req, res) => res.json({ message: "Team member deleted successfully" }));

app.get("/api/calendar/count", (req, res) => res.json({ count: events.length }));
app.get("/api/calendar", (req, res) => res.json(events));
app.get("/api/entities/totals-with-trends", (req, res) => res.json(stats));
app.get("/api/line/available-periods", (req, res) => res.json(periods));
app.get("/api/barbki/available-periods", (req, res) => res.json(periods));
app.get("/api/barsci/available-periods", (req, res) => res.json(periods));
app.get("/api/barsi/available-periods", (req, res) => res.json(periods));
app.get("/api/line", (req, res) => res.json(monthly));
app.get("/api/barbki", (req, res) => res.json(monthly.map(({ year, bulan, bki }) => ({ year, bulan, bki }))));
app.get("/api/barsci", (req, res) => res.json(monthly.map(({ year, bulan, sci }) => ({ year, bulan, sci }))));
app.get("/api/barsi", (req, res) => res.json(monthly.map(({ year, bulan, si }) => ({ year, bulan, si }))));
app.get("/api/pie", (req, res) => res.json(pie));
app.get("/api/BKI", (req, res) => res.json(monthly.map(({ year, bulan, bki }) => ({ year, bulan, bki }))));
app.get("/api/SCI", (req, res) => res.json(monthly.map(({ year, bulan, sci }) => ({ year, bulan, sci }))));
app.get("/api/SI", (req, res) => res.json(monthly.map(({ year, bulan, si }) => ({ year, bulan, si }))));
app.get("/api/entities", (req, res) => res.json(monthly));
app.get("/api/users", (req, res) => res.json(team));

["/api/BKI", "/api/SCI", "/api/SI", "/api/entities", "/api/pie", "/api/line", "/api/barbki", "/api/barsci", "/api/barsi", "/api/calendar"].forEach((route) => {
  app.post(route, (req, res) => res.status(201).json({ message: "Demo data accepted", data: req.body }));
  app.put(`${route}/:id`, (req, res) => res.json({ message: "Demo data updated", data: req.body }));
  app.delete(`${route}/:id`, (req, res) => res.json({ message: "Demo data deleted" }));
});

app.post("/api/chatbot", (req, res) => res.json({ reply: "Demo mode aktif. Hubungkan PostgreSQL untuk data asli." }));
app.get("/api/*", (req, res) => res.json([]));

app.listen(PORT, () => console.log(`Public demo backend running on port ${PORT}`));

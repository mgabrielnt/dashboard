const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const year = new Date().getFullYear();
const months = Array.from({ length: 12 }, (_, index) => index + 1);

const admin = {
  id: 1,
  name: "Demo Admin",
  email: "admin@dashboard.demo",
  role: "admin",
  profile_picture: null,
  phone: "+62 812-0000-0000",
  address: "Jakarta, Indonesia",
  department: "Executive Office",
  job_title: "Dashboard Administrator",
  bio: "Administrator demo untuk showcase dashboard.",
};

const team = [
  admin,
  { id: 2, name: "Nadia Putri", email: "nadia@dashboard.demo", role: "manager", profile_picture: null, phone: "+62 812-1000-1000", address: "Jakarta", department: "BKI", job_title: "BKI Manager", bio: "Demo manager BKI" },
  { id: 3, name: "Raka Pratama", email: "raka@dashboard.demo", role: "user", profile_picture: null, phone: "+62 812-2000-2000", address: "Surabaya", department: "SCI", job_title: "SCI Analyst", bio: "Demo analyst SCI" },
  { id: 4, name: "Alya Mahendra", email: "alya@dashboard.demo", role: "user", profile_picture: null, phone: "+62 812-3000-3000", address: "Bali", department: "SI", job_title: "SI Controller", bio: "Demo controller SI" },
];

const makeTableRows = (entity, base, step, topic) =>
  months.map((month, index) => {
    const paddedMonth = String(month).padStart(2, "0");
    return {
      id: index + 1,
      __connect_topic: topic,
      __connect_partition: index % 4,
      __connect_offset: 18420 + index * 37,
      coa: `${entity}-${4100 + index}`,
      value: base + index * step,
      entitas: entity,
      year,
      posting_period: `${year}-${paddedMonth}`,
      data_date: `${year}-${paddedMonth}-28`,
      timestamp: `${year}-${paddedMonth}-28T09:30:00.000Z`,
      bulan: month,
      [entity.toLowerCase()]: base + index * step,
    };
  });

const bkiRows = makeTableRows("BKI", 1800000000, 165000000, "finance.bki.monthly");
const sciRows = makeTableRows("SCI", 1250000000, 138000000, "finance.sci.monthly");
const siRows = makeTableRows("SI", 980000000, 97000000, "finance.si.monthly");

const monthly = months.map((month, index) => ({
  year,
  bulan: month,
  bki: bkiRows[index].value,
  sci: sciRows[index].value,
  si: siRows[index].value,
}));

const sum = (rows) => rows.reduce((total, item) => total + Number(item.value || 0), 0);
const stats = {
  bki: { value: sum(bkiRows), increase: "+18.4%", progress: "0.78" },
  sci: { value: sum(sciRows), increase: "+14.7%", progress: "0.69" },
  si: { value: sum(siRows), increase: "+11.2%", progress: "0.61" },
  konsol: { value: 4200000000, increase: "+9.8%", progress: "0.55" },
};

const pie = [
  { id: "BKI", label: "BKI", value: stats.bki.value },
  { id: "SCI", label: "SCI", value: stats.sci.value },
  { id: "SI", label: "SI", value: stats.si.value },
  { id: "KONSOL", label: "KONSOL", value: stats.konsol.value },
];

const periods = [{ year, available_months: months }, { year: year - 1, available_months: months }];
const events = [
  { id: 1, title: "Quarterly BKI Review", start: `${year}-07-15`, end: `${year}-07-15`, description: "Review performa BKI kuartalan" },
  { id: 2, title: "SCI Planning Session", start: `${year}-08-05`, end: `${year}-08-05`, description: "Agenda perencanaan SCI" },
  { id: 3, title: "SI Monthly Report", start: `${year}-09-10`, end: `${year}-09-10`, description: "Checkpoint laporan SI" },
];

app.get("/api/health", (req, res) => res.json({ status: "ok", mode: "showcase-demo" }));
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
app.get("/api/barbki", (req, res) => res.json(bkiRows.map(({ year, bulan, value }) => ({ year, bulan, bki: value }))));
app.get("/api/barsci", (req, res) => res.json(sciRows.map(({ year, bulan, value }) => ({ year, bulan, sci: value }))));
app.get("/api/barsi", (req, res) => res.json(siRows.map(({ year, bulan, value }) => ({ year, bulan, si: value }))));
app.get("/api/pie", (req, res) => res.json(pie));

app.get("/api/bki", (req, res) => res.json(bkiRows));
app.get("/api/BKI", (req, res) => res.json(bkiRows));
app.get("/api/sci", (req, res) => res.json(sciRows));
app.get("/api/SCI", (req, res) => res.json(sciRows));
app.get("/api/si", (req, res) => res.json(siRows));
app.get("/api/SI", (req, res) => res.json(siRows));
app.get("/api/entities", (req, res) => res.json(monthly));
app.get("/api/users", (req, res) => res.json(team));

["/api/bki", "/api/BKI", "/api/sci", "/api/SCI", "/api/si", "/api/SI", "/api/entities", "/api/pie", "/api/line", "/api/barbki", "/api/barsci", "/api/barsi", "/api/calendar"].forEach((route) => {
  app.post(route, (req, res) => res.status(201).json({ message: "Demo data accepted", data: req.body }));
  app.put(`${route}/:id`, (req, res) => res.json({ message: "Demo data updated", data: req.body }));
  app.delete(`${route}/:id`, (req, res) => res.json({ message: "Demo data deleted" }));
});

app.post("/api/chatbot", (req, res) => res.json({ reply: "Demo mode aktif. Hubungkan PostgreSQL untuk data asli." }));
app.get("/api/*", (req, res) => res.json([]));

app.listen(PORT, () => console.log(`Showcase demo backend running on port ${PORT}`));

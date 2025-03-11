const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const usersRoutes = require("./usersRoutes");
const BKIRoutes = require("./BKIRoutes");
const SCIRoutes = require("./SCIRoutes");
const SIRoutes = require("./SIRoutes");
const teamRoutes = require("./teamRoutes");
const piechart= require("./pieRoutes");
const linechart= require("./lineRoutes");
const barchartbki= require("./barbkiRoutes")
const barchartsci= require("./barsciRoutes")
const barchartsi= require("./barsiRoutes")



app.use("/api/users", usersRoutes);
app.use("/api/BKI", BKIRoutes);
app.use("/api/SCI", SCIRoutes);
app.use("/api/SI", SIRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/pie", piechart);
app.use("/api/line",linechart);
app.use("/api/barbki",barchartbki);
app.use("/api/barsci",barchartsci);
app.use("/api/barsi",barchartsi);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
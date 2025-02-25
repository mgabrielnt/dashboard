const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const usersRoutes = require("./usersRoutes");
const contactsRoutes = require("./contactsRoutes");
const teamRoutes = require("./teamRoutes");


app.use("/api/users", usersRoutes);
app.use("/api/contacts", contactsRoutes);
app.use("/api/team", teamRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

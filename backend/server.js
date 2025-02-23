const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const usersRoutes = require("./usersRoutes");
const contactsRoutes = require("./contactsRoutes");

app.use("/api/users", usersRoutes);
app.use("/api/contacts", contactsRoutes);

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});

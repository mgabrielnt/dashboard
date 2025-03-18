const express = require("express");
const { Pool } = require("pg");
const { body, validationResult } = require("express-validator");

const router = express.Router();
const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "dashboard",
    password: "1",
    port: 5432,
});

// Tambah user ke tabel users
router.post(
  "/",
  [
    body("firstName").notEmpty().withMessage("First name is required"),
    body("lastName").notEmpty().withMessage("Last name is required"),
    body("email").isEmail().withMessage("Invalid email format"),
    body("contact").isMobilePhone().withMessage("Invalid phone number"),
    body("address1").notEmpty().withMessage("Address 1 is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { firstName, lastName, email, contact, address1, address2 } = req.body;
      const result = await pool.query(
        "INSERT INTO users (first_name, last_name, email, contact, address1, address2) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [firstName, lastName, email, contact, address1, address2]
      );

      res.status(201).json({ message: "User created", user: result.rows[0] });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Dapatkan semua user
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update user berdasarkan ID
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, contact, address1, address2 } = req.body;

    const result = await pool.query(
      "UPDATE users SET first_name = $1, last_name = $2, email = $3, contact = $4, address1 = $5, address2 = $6 WHERE id = $7 RETURNING *",
      [firstName, lastName, email, contact, address1, address2, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User updated", user: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Hapus user berdasarkan ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING *", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User deleted", user: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
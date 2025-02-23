const express = require("express");
const { Pool } = require("pg");

const router = express.Router();
const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "dashboard",
    password: "1",
    port: 5432,
});

// Tambah kontak ke tabel contacts
router.post("/", async (req, res) => {
  try {
    const { userId, phone, address } = req.body;

    if (!userId || !phone || !address) {
      return res.status(400).json({ error: "userId, phone, and address are required" });
    }
    
    const result = await pool.query(
      "INSERT INTO contacts (user_id, phone, address) VALUES ($1, $2, $3) RETURNING *",
      [userId, phone, address]
    );

    res.status(201).json({ message: "Contact created", contact: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Dapatkan semua kontak
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM contacts");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update kontak berdasarkan ID
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { phone, address } = req.body;

    if (!phone || !address) {
      return res.status(400).json({ error: "phone and address are required" });
    }

    const result = await pool.query(
      "UPDATE contacts SET phone = $1, address = $2 WHERE id = $3 RETURNING *",
      [phone, address, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Contact not found" });
    }

    res.json({ message: "Contact updated", contact: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Hapus kontak berdasarkan ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM contacts WHERE id = $1 RETURNING *", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Contact not found" });
    }

    res.json({ message: "Contact deleted", contact: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;

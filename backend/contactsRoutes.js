const express = require("express");
const { Pool } = require("pg");

const router = express.Router();
const pool = new Pool({
    user: "kafkauser",
    host: "172.21.80.1",
    database: "staging_dwh",
    password: "JsuA2d5sh4bhLAya",
    port: 5458,
});

// Tambah data ke tabel master_konsol
router.post("/", async (req, res) => {
  try {
    console.log("Request received:", req.body);
    const { code_fs, code_calk, coa_holding, description, type } = req.body;

    if (!code_fs || !code_calk || !coa_holding || !description || !type) {
      return res.status(400).json({ error: "Semua field diperlukan" });
    }

    const result = await pool.query(
      "INSERT INTO master_konsol (code_fs, code_calk, coa_holding, description, type) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [code_fs, code_calk, coa_holding, description, type]
    );

    console.log("Data berhasil ditambahkan:", result.rows[0]);
    res.status(201).json({ message: "Data berhasil ditambahkan", data: result.rows[0] });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
});

// Dapatkan semua data dari master_konsol
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM master_konsol");
    res.json(result.rows);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
});

// Update data berdasarkan ID di master_konsol
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { code_fs, code_calk, coa_holding, description, type } = req.body;

    if (!code_fs || !code_calk || !coa_holding || !description || !type) {
      return res.status(400).json({ error: "Semua field diperlukan" });
    }

    // Pastikan ID ada sebelum update
    const checkId = await pool.query("SELECT id FROM master_konsol WHERE id = $1", [id]);
    if (checkId.rowCount === 0) {
      return res.status(404).json({ error: "Data tidak ditemukan" });
    }

    const result = await pool.query(
      "UPDATE master_konsol SET code_fs = $1, code_calk = $2, coa_holding = $3, description = $4, type = $5 WHERE id = $6 RETURNING *",
      [code_fs, code_calk, coa_holding, description, type, id]
    );

    res.json({ message: "Data berhasil diperbarui", data: result.rows[0] });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
});

// Hapus data berdasarkan ID di master_konsol
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Pastikan ID ada sebelum dihapus
    const checkId = await pool.query("SELECT id FROM master_konsol WHERE id = $1", [id]);
    if (checkId.rowCount === 0) {
      return res.status(404).json({ error: "Data tidak ditemukan" });
    }

    const result = await pool.query("DELETE FROM master_konsol WHERE id = $1 RETURNING *", [id]);

    res.json({ message: "Data berhasil dihapus", data: result.rows[0] });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
});

module.exports = router;

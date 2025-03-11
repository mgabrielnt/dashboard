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

// Ambil semua data dari tabel bki_monthly_tb
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM bki_monthly_tb");
    res.json(result.rows);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
});

// Tambah data ke tabel bki_monthly_tb
router.post("/", async (req, res) => {
  try {
    const { __connect_topic, __connect_partition, __connect_offset, coa, value, entitas, year, posting_period, data_date, timestamp } = req.body;

    if (!__connect_topic || !__connect_partition || !__connect_offset || !coa || !value || !entitas || !year || !posting_period || !data_date || !timestamp) {
      return res.status(400).json({ error: "Semua field diperlukan" });
    }

    const result = await pool.query(
      `INSERT INTO bki_monthly_tb (__connect_topic, __connect_partition, __connect_offset, coa, value, entitas, year, posting_period, data_date, timestamp) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [__connect_topic, __connect_partition, __connect_offset, coa, value, entitas, year, posting_period, data_date, timestamp]
    );

    res.status(201).json({ message: "Data berhasil ditambahkan", data: result.rows[0] });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
});

// Update data berdasarkan ID
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { __connect_topic, __connect_partition, __connect_offset, coa, value, entitas, year, posting_period, data_date, timestamp } = req.body;

    if (!__connect_topic || !__connect_partition || !__connect_offset || !coa || !value || !entitas || !year || !posting_period || !data_date || !timestamp) {
      return res.status(400).json({ error: "Semua field diperlukan" });
    }

    const checkId = await pool.query("SELECT id FROM bki_monthly_tb WHERE id = $1", [id]);
    if (checkId.rowCount === 0) {
      return res.status(404).json({ error: "Data tidak ditemukan" });
    }

    const result = await pool.query(
      `UPDATE bki_monthly_tb SET __connect_topic = $1, __connect_partition = $2, __connect_offset = $3, coa = $4, value = $5, entitas = $6, year = $7, posting_period = $8, data_date = $9, timestamp = $10 WHERE id = $11 RETURNING *`,
      [__connect_topic, __connect_partition, __connect_offset, coa, value, entitas, year, posting_period, data_date, timestamp, id]
    );

    res.json({ message: "Data berhasil diperbarui", data: result.rows[0] });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
});

// Hapus data berdasarkan ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const checkId = await pool.query("SELECT id FROM bki_monthly_tb WHERE id = $1", [id]);
    if (checkId.rowCount === 0) {
      return res.status(404).json({ error: "Data tidak ditemukan" });
    }

    const result = await pool.query("DELETE FROM bki_monthly_tb WHERE id = $1 RETURNING *", [id]);

    res.json({ message: "Data berhasil dihapus", data: result.rows[0] });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
});

module.exports = router;

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

router.get("/", async (req, res) => {
  try {
    const query = `
    SELECT 
        EXTRACT(YEAR FROM TO_DATE(tahun::TEXT, 'YYYY')) AS year, 
        EXTRACT(MONTH FROM TO_DATE(bulan::TEXT, 'MM')) AS bulan,
        si
    FROM split_pivot_all_full_real_test
    WHERE id = 138
      AND EXTRACT(MONTH FROM TO_DATE(bulan::TEXT, 'MM')) >= 1 -- Filter mulai dari bulan 8 (Agustus)
    GROUP BY year, bulan, si
    ORDER BY year, bulan;
    `;


    const result = await pool.query(query);
    

    res.json(result.rows);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
});

// Tambah data ke tabel split_pivot_all_full_real_test
router.post("/", async (req, res) => {
  try {
    const { id, code_fs, code_calk, coa_holding, description, type, tahun, bulan, bki, sci, si, combine, dr, cr, konsol } = req.body;

    if (!id || !code_fs || !code_calk || !coa_holding || !description || !type || !tahun || !bulan || !bki || !sci || !si || !combine || !dr || !cr || !konsol) {
      return res.status(400).json({ error: "Semua field diperlukan" });
    }

    const result = await pool.query(
      `INSERT INTO split_pivot_all_full_real_test (id, code_fs, code_calk, coa_holding, description, type, tahun, bulan, bki, sci, si, combine, dr, cr, konsol) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
      [id, code_fs, code_calk, coa_holding, description, type, tahun, bulan, bki, sci, si, combine, dr, cr, konsol]
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
    const { code_fs, code_calk, coa_holding, description, type, tahun, bulan, bki, sci, si, combine, dr, cr, konsol } = req.body;

    const checkId = await pool.query("SELECT id FROM split_pivot_all_full_real_test WHERE id = $1", [id]);
    if (checkId.rowCount === 0) {
      return res.status(404).json({ error: "Data tidak ditemukan" });
    }

    const result = await pool.query(
      `UPDATE split_pivot_all_full_real_test SET code_fs = $1, code_calk = $2, coa_holding = $3, description = $4, type = $5, tahun = $6, bulan = $7, bki = $8, sci = $9, si = $10, combine = $11, dr = $12, cr = $13, konsol = $14 WHERE id = $15 RETURNING *`,
      [code_fs, code_calk, coa_holding, description, type, tahun, bulan, bki, sci, si, combine, dr, cr, konsol, id]
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

    const checkId = await pool.query("SELECT id FROM split_pivot_all_full_real_test WHERE id = $1", [id]);
    if (checkId.rowCount === 0) {
      return res.status(404).json({ error: "Data tidak ditemukan" });
    }

    const result = await pool.query("DELETE FROM split_pivot_all_full_real_test WHERE id = $1 RETURNING *", [id]);

    res.json({ message: "Data berhasil dihapus", data: result.rows[0] });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
});

module.exports = router;

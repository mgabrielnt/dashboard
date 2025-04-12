const express = require("express");
const { Pool } = require("pg");

const router = express.Router();
const pool = new Pool({
    user: "kafkauser",
    host: "172.26.128.1",
    database: "staging_dwh",
    password: "JsuA2d5sh4bhLAya",
    port: 5458,
});

router.get("/", async (req, res) => {
  try {
    // Extract time range parameters
    const { startYear, endYear, startMonth, endMonth, startDate, endDate } = req.query;
    
    console.log("API Request Parameters:", { startYear, endYear, startMonth, endMonth, startDate, endDate });
    
    // Start building the query
    let query = `
    SELECT 
        EXTRACT(YEAR FROM TO_DATE(tahun::TEXT, 'YYYY')) AS year, 
        EXTRACT(MONTH FROM TO_DATE(bulan::TEXT, 'MM')) AS bulan,
        si
    FROM split_pivot_all_full_real_test
    WHERE id = 138
    `;
    
    // Add time range filters if provided
    const whereConditions = [];
    const queryParams = [];
    let paramIndex = 1;
    
    // Create a date range filter that works across years
    if (startYear && endYear) {
      // This handles the general case across years
      // Convert year/month combinations to YYYY-MM format for comparison
      whereConditions.push(`
        (
          (EXTRACT(YEAR FROM TO_DATE(tahun::TEXT, 'YYYY')) * 100 + EXTRACT(MONTH FROM TO_DATE(bulan::TEXT, 'MM'))) 
          >= 
          ($${paramIndex} * 100 + $${paramIndex + 1})
          AND
          (EXTRACT(YEAR FROM TO_DATE(tahun::TEXT, 'YYYY')) * 100 + EXTRACT(MONTH FROM TO_DATE(bulan::TEXT, 'MM'))) 
          <= 
          ($${paramIndex + 2} * 100 + $${paramIndex + 3})
        )
      `);
      
      // Pass the values for year and month
      queryParams.push(
        parseInt(startYear),
        startMonth ? parseInt(startMonth) : 1,
        parseInt(endYear),
        endMonth ? parseInt(endMonth) : 12
      );
      paramIndex += 4;
    }
    // If only specific dates are provided, use them for filtering
    else if (startDate && endDate) {
      whereConditions.push(`
        (
          TO_DATE(tahun::TEXT || bulan::TEXT, 'YYYYMM') 
          BETWEEN 
          TO_DATE($${paramIndex}, 'YYYY-MM-DD') AND TO_DATE($${paramIndex + 1}, 'YYYY-MM-DD')
        )
      `);
      queryParams.push(startDate, endDate);
      paramIndex += 2;
    }
    
    // Apply the WHERE conditions if any
    if (whereConditions.length > 0) {
      query += ` AND ${whereConditions.join(' AND ')}`;
    }
    
    // Complete the query with GROUP BY and ORDER BY
    query += `
    GROUP BY year, bulan, si
    ORDER BY year, bulan
    `;
    
    console.log("BarsiChart Query:", query);
    console.log("Query Parameters:", queryParams);
    
    // Execute the query
    const result = queryParams.length > 0 
      ? await pool.query(query, queryParams)
      : await pool.query(query);

    // Log the number of rows returned
    console.log(`Query returned ${result.rows.length} rows`);
    
    // Transform the data for frontend consumption if needed
    const transformedData = result.rows.map(row => ({
      bulan: `${row.year}-${String(row.bulan).padStart(2, '0')}`,
      si: row.si,
      year: row.year
    }));
    
    res.json(transformedData);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
});

// Endpoint to get available years and months
router.get("/available-periods", async (req, res) => {
  try {
    const query = `
      SELECT 
        EXTRACT(YEAR FROM TO_DATE(tahun::TEXT, 'YYYY')) AS year,
        array_agg(DISTINCT EXTRACT(MONTH FROM TO_DATE(bulan::TEXT, 'MM'))) AS available_months
      FROM split_pivot_all_full_real_test
      WHERE id = 138
      GROUP BY year
      ORDER BY year
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching available periods:", error);
    res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
});

// Add these endpoints from your original code
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
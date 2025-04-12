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

// Main endpoint for line chart data with improved time range handling
router.get("/", async (req, res) => {
  try {
    // Get query parameters for filtering
    const { year, yearRange, startMonth, endMonth, groupBy = 'month' } = req.query;
    
    // Base query - always use month-based grouping for consistent x-axis display
    let query;
    const params = [];
    let paramCount = 1;
    
    // Always use month-based grouping for consistent x-axis display
    query = `
      SELECT 
          EXTRACT(YEAR FROM TO_DATE(tahun::TEXT, 'YYYY')) AS year,
          EXTRACT(MONTH FROM TO_DATE(bulan::TEXT, 'MM')) AS bulan,
          bki, sci, si
      FROM split_pivot_all_full_real_test
      WHERE id = 200
    `;
    
    // Add year filter condition
    if (yearRange) {
      // Handle year range (e.g., 2022-2023)
      const [startYear, endYear] = yearRange.split('-').map(Number);
      query += ` AND EXTRACT(YEAR FROM TO_DATE(tahun::TEXT, 'YYYY')) BETWEEN $${paramCount} AND $${paramCount + 1}`;
      params.push(startYear, endYear);
      paramCount += 2;
    } else if (year) {
      // Handle single year
      query += ` AND EXTRACT(YEAR FROM TO_DATE(tahun::TEXT, 'YYYY')) = $${paramCount}`;
      params.push(year);
      paramCount++;
    }
    
    // Add month range filter conditions
    if (startMonth) {
      query += ` AND EXTRACT(MONTH FROM TO_DATE(bulan::TEXT, 'MM')) >= $${paramCount}`;
      params.push(startMonth);
      paramCount++;
    }
    
    if (endMonth) {
      query += ` AND EXTRACT(MONTH FROM TO_DATE(bulan::TEXT, 'MM')) <= $${paramCount}`;
      params.push(endMonth);
      paramCount++;
    }
    
    // Complete the query with grouping and ordering - always by month
    query += `
      GROUP BY year, bulan, bki, sci, si
      ORDER BY year, bulan
    `;

    console.log("Executing query:", query);
    console.log("With parameters:", params);

    // Execute the query
    const result = await pool.query(query, params);
    
    // Add error handling for empty results
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: "No data found for the specified criteria",
        message: "Please try with different parameters",
        parameters: {
          year, yearRange, startMonth, endMonth, groupBy
        }
      });
    }

    res.json(result.rows);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ 
      error: "Server error", 
      message: error.message,
      hint: "Please check database connection and query parameters"
    });
  }
});

// Enhanced endpoint to get available periods for filtering
router.get("/available-periods", async (req, res) => {
  try {
    const query = `
      SELECT 
        DISTINCT EXTRACT(YEAR FROM TO_DATE(tahun::TEXT, 'YYYY')) AS year,
        array_agg(DISTINCT EXTRACT(MONTH FROM TO_DATE(bulan::TEXT, 'MM')) ORDER BY EXTRACT(MONTH FROM TO_DATE(bulan::TEXT, 'MM'))) AS available_months
      FROM split_pivot_all_full_real_test
      WHERE id = 200
      GROUP BY year
      ORDER BY year
    `;
    
    const result = await pool.query(query);
    
    // Add metadata about total available range
    let minYear, maxYear, earliestMonth, latestMonth;
    
    if (result.rows.length > 0) {
      minYear = Number(result.rows[0].year);
      maxYear = Number(result.rows[result.rows.length - 1].year);
      
      earliestMonth = Number(result.rows[0].available_months[0]);
      latestMonth = Number(result.rows[result.rows.length - 1].available_months[
        result.rows[result.rows.length - 1].available_months.length - 1
      ]);
    }
    
    res.json(result.rows);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ 
      error: "Server error", 
      message: error.message 
    });
  }
});

// New endpoint to validate a time range against available data
router.post("/validate-range", async (req, res) => {
  try {
    const { startYear, startMonth, endYear, endMonth } = req.body;
    
    if (!startYear || !startMonth || !endYear || !endMonth) {
      return res.status(400).json({
        error: "Missing parameters",
        message: "All of startYear, startMonth, endYear, endMonth are required"
      });
    }
    
    // Query to check if the range has any data
    const query = `
      SELECT COUNT(*) as count
      FROM split_pivot_all_full_real_test
      WHERE id = 200
        AND EXTRACT(YEAR FROM TO_DATE(tahun::TEXT, 'YYYY')) >= $1
        AND EXTRACT(YEAR FROM TO_DATE(tahun::TEXT, 'YYYY')) <= $2
        AND ((EXTRACT(YEAR FROM TO_DATE(tahun::TEXT, 'YYYY')) > $1 AND EXTRACT(YEAR FROM TO_DATE(tahun::TEXT, 'YYYY')) < $2) 
            OR (EXTRACT(YEAR FROM TO_DATE(tahun::TEXT, 'YYYY')) = $1 AND EXTRACT(MONTH FROM TO_DATE(bulan::TEXT, 'MM')) >= $3)
            OR (EXTRACT(YEAR FROM TO_DATE(tahun::TEXT, 'YYYY')) = $2 AND EXTRACT(MONTH FROM TO_DATE(bulan::TEXT, 'MM')) <= $4))
    `;
    
    const result = await pool.query(query, [startYear, endYear, startMonth, endMonth]);
    
    const hasData = result.rows[0].count > 0;
    
    if (hasData) {
      res.json({
        valid: true,
        message: "Time range contains data",
        count: result.rows[0].count
      });
    } else {
      // If no data in the requested range, find the closest valid range
      const closestRangeQuery = `
        SELECT 
          MIN(EXTRACT(YEAR FROM TO_DATE(tahun::TEXT, 'YYYY'))) as min_year,
          MAX(EXTRACT(YEAR FROM TO_DATE(tahun::TEXT, 'YYYY'))) as max_year,
          MIN(EXTRACT(MONTH FROM TO_DATE(bulan::TEXT, 'MM'))) as min_month,
          MAX(EXTRACT(MONTH FROM TO_DATE(bulan::TEXT, 'MM'))) as max_month
        FROM split_pivot_all_full_real_test
        WHERE id = 200
      `;
      
      const closestResult = await pool.query(closestRangeQuery);
      
      res.json({
        valid: false,
        message: "No data in specified time range",
        suggestion: {
          startYear: Number(closestResult.rows[0].min_year),
          startMonth: Number(closestResult.rows[0].min_month),
          endYear: Number(closestResult.rows[0].max_year),
          endMonth: Number(closestResult.rows[0].max_month)
        }
      });
    }
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ 
      error: "Server error", 
      message: error.message 
    });
  }
});

// Keep existing endpoints
router.post("/", async (req, res) => {
  try {
    const { id, code_fs, code_calk, coa_holding, description, type, tahun, bulan, bki, sci, si, combine, dr, cr, konsol } = req.body;

    if (!id || !code_fs || !code_calk || !coa_holding || !description || !type || !tahun || !bulan || !bki || !sci || !si || !combine || !dr || !cr || !konsol) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const result = await pool.query(
      `INSERT INTO split_pivot_all_full_real_test (id, code_fs, code_calk, coa_holding, description, type, tahun, bulan, bki, sci, si, combine, dr, cr, konsol) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
      [id, code_fs, code_calk, coa_holding, description, type, tahun, bulan, bki, sci, si, combine, dr, cr, konsol]
    );

    res.status(201).json({ message: "Data added successfully", data: result.rows[0] });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { code_fs, code_calk, coa_holding, description, type, tahun, bulan, bki, sci, si, combine, dr, cr, konsol } = req.body;

    const checkId = await pool.query("SELECT id FROM split_pivot_all_full_real_test WHERE id = $1", [id]);
    if (checkId.rowCount === 0) {
      return res.status(404).json({ error: "Data not found" });
    }

    const result = await pool.query(
      `UPDATE split_pivot_all_full_real_test SET code_fs = $1, code_calk = $2, coa_holding = $3, description = $4, type = $5, tahun = $6, bulan = $7, bki = $8, sci = $9, si = $10, combine = $11, dr = $12, cr = $13, konsol = $14 WHERE id = $15 RETURNING *`,
      [code_fs, code_calk, coa_holding, description, type, tahun, bulan, bki, sci, si, combine, dr, cr, konsol, id]
    );

    res.json({ message: "Data updated successfully", data: result.rows[0] });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const checkId = await pool.query("SELECT id FROM split_pivot_all_full_real_test WHERE id = $1", [id]);
    if (checkId.rowCount === 0) {
      return res.status(404).json({ error: "Data not found" });
    }

    const result = await pool.query("DELETE FROM split_pivot_all_full_real_test WHERE id = $1 RETURNING *", [id]);

    res.json({ message: "Data deleted successfully", data: result.rows[0] });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
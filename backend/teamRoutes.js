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

router.get("/team-count", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT name, COUNT(*) AS count
      FROM team
      GROUP BY name
      ORDER BY count DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database query failed" });
  }
});

module.exports = router;
const express = require("express");
const router = express.Router();
const { Pool } = require("pg");

// PostgreSQL connection
const pool = new Pool({
  user: "kafkauser",
  host: "172.21.80.1",
  database: "staging_dwh",
  password: "JsuA2d5sh4bhLAya",
  port: 5458,
});

// GET all events
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM calendar_events ORDER BY start_date");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Failed to fetch events", details: error.message });
  }
});

// GET a single event
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM calendar_events WHERE id = $1", [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({ error: "Failed to fetch event", details: error.message });
  }
});

// CREATE a new event
router.post("/", async (req, res) => {
  try {
    const { title, start, end, allDay } = req.body;
    
    if (!title || !start) {
      return res.status(400).json({ error: "Title and start date are required" });
    }
    
    const result = await pool.query(
      "INSERT INTO calendar_events (title, start_date, end_date, all_day) VALUES ($1, $2, $3, $4) RETURNING *",
      [title, start, end || start, allDay || false]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ error: "Failed to create event", details: error.message });
  }
});

// UPDATE an event
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, start, end, allDay } = req.body;
    
    if (!title || !start) {
      return res.status(400).json({ error: "Title and start date are required" });
    }
    
    const result = await pool.query(
      "UPDATE calendar_events SET title = $1, start_date = $2, end_date = $3, all_day = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *",
      [title, start, end || start, allDay || false, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ error: "Failed to update event", details: error.message });
  }
});

// DELETE an event
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query("DELETE FROM calendar_events WHERE id = $1 RETURNING *", [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }
    
    res.json({ message: "Event deleted successfully", id });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ error: "Failed to delete event", details: error.message });
  }
});

module.exports = router;
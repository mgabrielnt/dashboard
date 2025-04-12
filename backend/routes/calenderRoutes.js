const express = require("express");
const router = express.Router();
const { Pool } = require("pg");

// PostgreSQL connection
const pool = new Pool({
  user: "kafkauser",
  host: "172.26.128.1",
  database: "staging_dwh",
  password: "JsuA2d5sh4bhLAya",
  port: 5458,
});

// GET count of events - Using a different approach with path matching
router.get("/count", async (req, res) => {
  try {
    console.log("Count endpoint accessed");
    const result = await pool.query("SELECT COUNT(*) FROM calendar_events");
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error("Error counting events:", error);
    res.status(500).json({ error: "Failed to count events", details: error.message });
  }
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
    
    // Skip the 'count' route - this is a safeguard in case Express routing doesn't work as expected
    if (id === 'count') {
      console.log("Count accessed through /:id route - this should not happen");
      return res.status(400).json({ error: "Invalid route. Please use /count endpoint directly." });
    }
    
    // Add validation to ensure id is numeric
    if (isNaN(parseInt(id))) {
      console.log(`Non-numeric ID received: ${id}`);
      return res.status(400).json({ error: "Invalid ID format. ID must be numeric." });
    }
    
    console.log(`Fetching event with ID: ${id}`);
    const result = await pool.query("SELECT * FROM calendar_events WHERE id = $1", [parseInt(id)]);
    
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
    
    // Add validation to ensure id is numeric
    if (isNaN(parseInt(id))) {
      return res.status(400).json({ error: "Invalid ID format. ID must be numeric." });
    }
    
    const { title, start, end, allDay } = req.body;
    
    if (!title || !start) {
      return res.status(400).json({ error: "Title and start date are required" });
    }
    
    const result = await pool.query(
      "UPDATE calendar_events SET title = $1, start_date = $2, end_date = $3, all_day = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *",
      [title, start, end || start, allDay || false, parseInt(id)]
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
    
    // Add validation to ensure id is numeric
    if (isNaN(parseInt(id))) {
      return res.status(400).json({ error: "Invalid ID format. ID must be numeric." });
    }
    
    const result = await pool.query("DELETE FROM calendar_events WHERE id = $1 RETURNING *", [parseInt(id)]);
    
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
const express = require('express');
const router = express.Router();
const pool = require('../db/db');

// GET all upcoming events
router.get('/', async (req, res) => {
  try {
    const [events] = await pool.query(
      "SELECT * FROM events WHERE date >= NOW()"
    );
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// POST create new event
router.post('/', async (req, res) => {
  try {
    const { title, description, date, total_capacity } = req.body;

    // validation
    if (!title || !date || !total_capacity) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await pool.query(
      `INSERT INTO events (title, description, date, total_capacity, remaining_tickets)
       VALUES (?, ?, ?, ?, ?)`,
      [title, description, date, total_capacity, total_capacity]
    );

    res.json({ message: "Event created successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
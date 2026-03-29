const express = require('express');
const router = express.Router();
const pool = require('../db/db');
const { v4: uuidv4 } = require('uuid');

// POST /bookings
router.post('/', async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { user_id, event_id } = req.body;

    if (!user_id || !event_id) {
      return res.status(400).json({ error: "Missing fields" });
    }

    await connection.beginTransaction();

    // lock row to prevent overbooking
    const [event] = await connection.query(
      "SELECT remaining_tickets FROM events WHERE id=? FOR UPDATE",
      [event_id]
    );

    if (!event.length) throw new Error("Event not found");

    if (event[0].remaining_tickets <= 0) {
      throw new Error("No tickets available");
    }

    const bookingCode = uuidv4();

    await connection.query(
      "INSERT INTO bookings (user_id, event_id, booking_code) VALUES (?, ?, ?)",
      [user_id, event_id, bookingCode]
    );

    await connection.query(
      "UPDATE events SET remaining_tickets = remaining_tickets - 1 WHERE id=?",
      [event_id]
    );

    await connection.commit();

    res.json({
      message: "Booking successful",
      bookingCode
    });

  } catch (err) {
    await connection.rollback();
    res.status(400).json({ error: err.message });
  } finally {
    connection.release();
  }
});


// GET bookings for a user
router.get('/user/:id', async (req, res) => {
  try {
    const [bookings] = await pool.query(
      "SELECT * FROM bookings WHERE user_id=?",
      [req.params.id]
    );

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST attendance
router.post('/attendance', async (req, res) => {
  try {
    const { booking_code } = req.body;

    const [booking] = await pool.query(
      "SELECT id FROM bookings WHERE booking_code=?",
      [booking_code]
    );

    if (!booking.length) {
      return res.status(404).json({ error: "Invalid booking code" });
    }

    await pool.query(
      "INSERT INTO attendance (booking_id) VALUES (?)",
      [booking[0].id]
    );

    res.json({ message: "Attendance recorded" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
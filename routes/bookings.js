const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Create a booking
router.post('/', authenticateToken, requireRole('student'), (req, res) => {
  try {
    const { teacher_id, subject, date, start_time, end_time, notes } = req.body;

    if (!teacher_id || !subject || !date || !start_time || !end_time) {
      return res.status(400).json({ error: 'All booking fields are required' });
    }

    // Check teacher exists and is approved
    const teacher = db.prepare(`
      SELECT tp.*, u.name as teacher_name 
      FROM teacher_profiles tp 
      JOIN users u ON tp.user_id = u.id 
      WHERE tp.user_id = ? AND tp.status = 'approved'
    `).get(teacher_id);

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found or not approved' });
    }

    // Calculate price (simple: hourly_rate * hours)
    const startParts = start_time.split(':').map(Number);
    const endParts = end_time.split(':').map(Number);
    const hours = (endParts[0] + endParts[1] / 60) - (startParts[0] + startParts[1] / 60);
    const total_price = Math.round(teacher.hourly_rate * hours * 100) / 100;

    const result = db.prepare(`
      INSERT INTO bookings (student_id, teacher_id, subject, date, start_time, end_time, notes, total_price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.user.id, teacher_id, subject, date, start_time, end_time, notes || '', total_price);

    res.status(201).json({
      message: 'Booking created successfully',
      booking: {
        id: result.lastInsertRowid,
        teacher_name: teacher.teacher_name,
        subject,
        date,
        start_time,
        end_time,
        total_price,
        status: 'pending'
      }
    });
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's bookings
router.get('/', authenticateToken, (req, res) => {
  try {
    const { status } = req.query;
    let query;
    const params = [];

    if (req.user.role === 'student') {
      query = `
        SELECT b.*, u.name as teacher_name, u.avatar as teacher_avatar, u.email as teacher_email
        FROM bookings b
        JOIN users u ON b.teacher_id = u.id
        WHERE b.student_id = ?
      `;
      params.push(req.user.id);
    } else if (req.user.role === 'teacher') {
      query = `
        SELECT b.*, u.name as student_name, u.avatar as student_avatar, u.email as student_email
        FROM bookings b
        JOIN users u ON b.student_id = u.id
        WHERE b.teacher_id = ?
      `;
      params.push(req.user.id);
    } else {
      // Admin sees all
      query = `
        SELECT b.*, 
               st.name as student_name, st.email as student_email,
               tc.name as teacher_name, tc.email as teacher_email
        FROM bookings b
        JOIN users st ON b.student_id = st.id
        JOIN users tc ON b.teacher_id = tc.id
        WHERE 1=1
      `;
    }

    if (status) {
      query += ` AND b.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY b.created_at DESC`;

    const bookings = db.prepare(query).all(...params);
    res.json({ bookings });
  } catch (err) {
    console.error('Get bookings error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update booking status
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { status } = req.body;
    const bookingId = req.params.id;

    if (!['confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Teachers can confirm/cancel, students can cancel, admin can do anything
    if (req.user.role === 'teacher' && booking.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Not your booking' });
    }
    if (req.user.role === 'student' && booking.student_id !== req.user.id) {
      return res.status(403).json({ error: 'Not your booking' });
    }
    if (req.user.role === 'student' && status !== 'cancelled') {
      return res.status(403).json({ error: 'Students can only cancel bookings' });
    }

    db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, bookingId);

    // If completed, update teacher stats
    if (status === 'completed') {
      db.prepare(`
        UPDATE teacher_profiles 
        SET total_students = (
          SELECT COUNT(DISTINCT student_id) FROM bookings 
          WHERE teacher_id = ? AND status = 'completed'
        )
        WHERE user_id = ?
      `).run(booking.teacher_id, booking.teacher_id);
    }

    res.json({ message: 'Booking updated', status });
  } catch (err) {
    console.error('Update booking error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Submit a review
router.post('/:id/review', authenticateToken, requireRole('student'), (req, res) => {
  try {
    const { rating, comment } = req.body;
    const bookingId = req.params.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const booking = db.prepare('SELECT * FROM bookings WHERE id = ? AND student_id = ? AND status = ?')
      .get(bookingId, req.user.id, 'completed');

    if (!booking) {
      return res.status(404).json({ error: 'Completed booking not found' });
    }

    // Check if already reviewed
    const existingReview = db.prepare('SELECT id FROM reviews WHERE booking_id = ?').get(bookingId);
    if (existingReview) {
      return res.status(409).json({ error: 'Already reviewed this booking' });
    }

    db.prepare(`
      INSERT INTO reviews (booking_id, student_id, teacher_id, rating, comment)
      VALUES (?, ?, ?, ?, ?)
    `).run(bookingId, req.user.id, booking.teacher_id, rating, comment || '');

    // Update teacher rating
    const avgRating = db.prepare(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as total
      FROM reviews WHERE teacher_id = ?
    `).get(booking.teacher_id);

    db.prepare(`
      UPDATE teacher_profiles SET rating = ?, total_reviews = ? WHERE user_id = ?
    `).run(Math.round(avgRating.avg_rating * 10) / 10, avgRating.total, booking.teacher_id);

    res.status(201).json({ message: 'Review submitted' });
  } catch (err) {
    console.error('Submit review error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

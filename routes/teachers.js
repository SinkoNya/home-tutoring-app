const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all approved teachers (public)
router.get('/', (req, res) => {
  try {
    const { subject, minRate, maxRate, minRating, search } = req.query;

    let query = `
      SELECT u.id, u.name, u.email, u.avatar, u.created_at,
             tp.bio, tp.hourly_rate, tp.experience_years, tp.subjects,
             tp.availability, tp.rating, tp.total_reviews, tp.total_students,
             tp.location, tp.education
      FROM users u
      JOIN teacher_profiles tp ON u.id = tp.user_id
      WHERE tp.status = 'approved' AND u.status = 'active'
    `;
    const params = [];

    if (subject) {
      query += ` AND tp.subjects LIKE ?`;
      params.push(`%${subject}%`);
    }
    if (minRate) {
      query += ` AND tp.hourly_rate >= ?`;
      params.push(parseFloat(minRate));
    }
    if (maxRate) {
      query += ` AND tp.hourly_rate <= ?`;
      params.push(parseFloat(maxRate));
    }
    if (minRating) {
      query += ` AND tp.rating >= ?`;
      params.push(parseFloat(minRating));
    }
    if (search) {
      query += ` AND (u.name LIKE ? OR tp.bio LIKE ? OR tp.subjects LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY tp.rating DESC, tp.total_reviews DESC`;

    const teachers = db.prepare(query).all(...params);

    teachers.forEach(t => {
      t.subjects = JSON.parse(t.subjects || '[]');
      t.availability = JSON.parse(t.availability || '{}');
    });

    res.json({ teachers });
  } catch (err) {
    console.error('Get teachers error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single teacher profile
router.get('/:id', (req, res) => {
  try {
    const teacher = db.prepare(`
      SELECT u.id, u.name, u.email, u.avatar, u.created_at,
             tp.bio, tp.hourly_rate, tp.experience_years, tp.subjects,
             tp.availability, tp.rating, tp.total_reviews, tp.total_students,
             tp.location, tp.education, tp.status as profile_status
      FROM users u
      JOIN teacher_profiles tp ON u.id = tp.user_id
      WHERE u.id = ?
    `).get(req.params.id);

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    teacher.subjects = JSON.parse(teacher.subjects || '[]');
    teacher.availability = JSON.parse(teacher.availability || '{}');

    // Get reviews
    const reviews = db.prepare(`
      SELECT r.*, u.name as student_name
      FROM reviews r
      JOIN users u ON r.student_id = u.id
      WHERE r.teacher_id = ?
      ORDER BY r.created_at DESC
      LIMIT 10
    `).all(req.params.id);

    res.json({ teacher, reviews });
  } catch (err) {
    console.error('Get teacher error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update teacher profile
router.put('/profile', authenticateToken, requireRole('teacher'), (req, res) => {
  try {
    const { bio, hourly_rate, experience_years, subjects, availability, location, education } = req.body;

    const updates = [];
    const params = [];

    if (bio !== undefined) { updates.push('bio = ?'); params.push(bio); }
    if (hourly_rate !== undefined) { updates.push('hourly_rate = ?'); params.push(hourly_rate); }
    if (experience_years !== undefined) { updates.push('experience_years = ?'); params.push(experience_years); }
    if (subjects !== undefined) { updates.push('subjects = ?'); params.push(JSON.stringify(subjects)); }
    if (availability !== undefined) { updates.push('availability = ?'); params.push(JSON.stringify(availability)); }
    if (location !== undefined) { updates.push('location = ?'); params.push(location); }
    if (education !== undefined) { updates.push('education = ?'); params.push(education); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(req.user.id);
    db.prepare(`UPDATE teacher_profiles SET ${updates.join(', ')} WHERE user_id = ?`).run(...params);

    // Also update user name/phone if provided
    if (req.body.name) {
      db.prepare('UPDATE users SET name = ? WHERE id = ?').run(req.body.name, req.user.id);
    }
    if (req.body.phone) {
      db.prepare('UPDATE users SET phone = ? WHERE id = ?').run(req.body.phone, req.user.id);
    }

    const profile = db.prepare('SELECT * FROM teacher_profiles WHERE user_id = ?').get(req.user.id);
    profile.subjects = JSON.parse(profile.subjects || '[]');
    profile.availability = JSON.parse(profile.availability || '{}');

    res.json({ message: 'Profile updated', profile });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

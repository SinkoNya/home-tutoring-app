const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireRole('admin'));

// Get all users
router.get('/users', (req, res) => {
  try {
    const { role, status, search } = req.query;
    let query = `SELECT id, name, email, role, phone, avatar, status, created_at FROM users WHERE 1=1`;
    const params = [];

    if (role) { query += ` AND role = ?`; params.push(role); }
    if (status) { query += ` AND status = ?`; params.push(status); }
    if (search) { query += ` AND (name LIKE ? OR email LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }

    query += ` ORDER BY created_at DESC`;
    const users = db.prepare(query).all(...params);
    res.json({ users });
  } catch (err) {
    console.error('Admin get users error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user status (activate/suspend)
router.put('/users/:id', (req, res) => {
  try {
    const { status } = req.body;
    const userId = req.params.id;

    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, userId);
    res.json({ message: `User ${status === 'active' ? 'activated' : 'suspended'}` });
  } catch (err) {
    console.error('Admin update user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user
router.delete('/users/:id', (req, res) => {
  try {
    const userId = req.params.id;
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('Admin delete user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get pending teacher applications
router.get('/teachers/pending', (req, res) => {
  try {
    const teachers = db.prepare(`
      SELECT u.id, u.name, u.email, u.created_at,
             tp.bio, tp.hourly_rate, tp.experience_years, tp.subjects,
             tp.education, tp.location, tp.status as profile_status
      FROM users u
      JOIN teacher_profiles tp ON u.id = tp.user_id
      WHERE tp.status = 'pending'
      ORDER BY u.created_at DESC
    `).all();

    teachers.forEach(t => {
      t.subjects = JSON.parse(t.subjects || '[]');
    });

    res.json({ teachers });
  } catch (err) {
    console.error('Admin get pending teachers error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Approve/reject teacher
router.put('/teachers/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    const teacherId = req.params.id;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Use approved or rejected.' });
    }

    const profile = db.prepare('SELECT * FROM teacher_profiles WHERE user_id = ?').get(teacherId);
    if (!profile) {
      return res.status(404).json({ error: 'Teacher profile not found' });
    }

    db.prepare('UPDATE teacher_profiles SET status = ? WHERE user_id = ?').run(status, teacherId);
    
    // Also activate the user account if approved
    if (status === 'approved') {
      db.prepare('UPDATE users SET status = ? WHERE id = ?').run('active', teacherId);
    }

    res.json({ message: `Teacher ${status}` });
  } catch (err) {
    console.error('Admin update teacher status error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Dashboard stats
router.get('/stats', (req, res) => {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const totalStudents = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student'").get().count;
    const totalTeachers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'teacher'").get().count;
    const pendingTeachers = db.prepare("SELECT COUNT(*) as count FROM teacher_profiles WHERE status = 'pending'").get().count;
    const totalBookings = db.prepare('SELECT COUNT(*) as count FROM bookings').get().count;
    const pendingBookings = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'pending'").get().count;
    const completedBookings = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'completed'").get().count;
    const totalRevenue = db.prepare("SELECT COALESCE(SUM(total_price), 0) as total FROM bookings WHERE status = 'completed'").get().total;

    // Recent bookings
    const recentBookings = db.prepare(`
      SELECT b.*, st.name as student_name, tc.name as teacher_name
      FROM bookings b
      JOIN users st ON b.student_id = st.id
      JOIN users tc ON b.teacher_id = tc.id
      ORDER BY b.created_at DESC
      LIMIT 10
    `).all();

    // Recent users
    const recentUsers = db.prepare(`
      SELECT id, name, email, role, status, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 10
    `).all();

    res.json({
      stats: {
        totalUsers,
        totalStudents,
        totalTeachers,
        pendingTeachers,
        totalBookings,
        pendingBookings,
        completedBookings,
        totalRevenue
      },
      recentBookings,
      recentUsers
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

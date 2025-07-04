import express from 'express';
import Activity from '../models/Activity.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get latest 20 activities
router.get('/', authenticateToken, async (req, res) => {
  try {
    const activities = await Activity.find({})
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(activities);
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
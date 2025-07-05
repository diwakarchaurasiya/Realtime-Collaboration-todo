import express from 'express';
import { body, validationResult } from 'express-validator';
import Task from '../models/Task.js';
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all tasks
router.get('/', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({})
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create task
router.post('/', [
  authenticateToken,
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('description').optional().trim(),
  body('priority').optional().isIn(['Low', 'Medium', 'High']),
  body('status').optional().isIn(['Todo', 'In Progress', 'Done'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, priority, status } = req.body;

    // Check for forbidden column names
    const forbiddenNames = ['todo', 'in progress', 'done', 'in-progress'];
    if (forbiddenNames.includes(title.toLowerCase())) {
      return res.status(400).json({ message: 'Task title cannot match column names' });
    }

    // Check for duplicate title in the same board
    const existingTask = await Task.findOne({
      title: title.trim(),
      boardId: 'main-board'
    });

    if (existingTask) {
      return res.status(400).json({ message: 'Task title must be unique' });
    }

    const task = new Task({
      title: title.trim(),
      description: description || '',
      priority: priority || 'Medium',
      status: status || 'Todo',
      createdBy: req.user._id,
      boardId: 'main-board'
    });

    await task.save();
    await task.populate('createdBy', 'name email avatar');

    // Log activity
    const activity = new Activity({
      user: req.user._id,
      action: 'created',
      taskId: task._id,
      taskTitle: task.title,
      details: `Created task "${task.title}"`
    });
    await activity.save();
    await activity.populate('user', 'name email avatar');

    // Emit socket events for real-time updates
    req.io.to('main-board').emit('task-created', task);
    req.io.to('main-board').emit('activity-added', activity);

    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update task
router.put('/:id', [
  authenticateToken,
  body('title').optional().trim().isLength({ min: 1 }),
  body('description').optional().trim(),
  body('priority').optional().isIn(['Low', 'Medium', 'High']),
  body('status').optional().isIn(['Todo', 'In Progress', 'Done'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updateData = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check for title uniqueness if title is being updated
    if (updateData.title && updateData.title !== task.title) {
      const forbiddenNames = ['todo', 'in progress', 'done', 'in-progress'];
      if (forbiddenNames.includes(updateData.title.toLowerCase())) {
        return res.status(400).json({ message: 'Task title cannot match column names' });
      }

      const existingTask = await Task.findOne({
        title: updateData.title.trim(),
        boardId: 'main-board',
        _id: { $ne: id }
      });

      if (existingTask) {
        return res.status(400).json({ message: 'Task title must be unique' });
      }
    }

    // Update task
    Object.assign(task, updateData);
    task.lastModified = new Date();
    task.version += 1;

    await task.save();
    await task.populate(['assignedUser', 'createdBy'], 'name email avatar');

    // Log activity
    const activity = new Activity({
      user: req.user._id,
      action: 'updated',
      taskId: task._id,
      taskTitle: task.title,
      details: `Updated task "${task.title}"`
    });
    await activity.save();
    await activity.populate('user', 'name email avatar');

    // Emit socket events for real-time updates
    req.io.to('main-board').emit('task-updated', task);
    req.io.to('main-board').emit('activity-added', activity);

    res.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete task
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Log activity before deletion
    const activity = new Activity({
      user: req.user._id,
      action: 'deleted',
      taskId: task._id,
      taskTitle: task.title,
      details: `Deleted task "${task.title}"`
    });
    await activity.save();
    await activity.populate('user', 'name email avatar');

    await Task.findByIdAndDelete(id);

    // Emit socket events for real-time updates
    req.io.to('main-board').emit('task-deleted', { taskId: id });
    req.io.to('main-board').emit('activity-added', activity);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Smart assign task
router.post('/:id/smart-assign', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Get all users
    const users = await User.find({});

    // Count active tasks for each user
    const userTaskCounts = await Promise.all(
      users.map(async (user) => {
        const activeTaskCount = await Task.countDocuments({
          assignedUser: user._id,
          status: { $in: ['Todo', 'In Progress'] }
        });
        return { user, activeTaskCount };
      })
    );

    // Find user with minimum active tasks
    const userWithMinTasks = userTaskCounts.reduce((min, current) =>
      current.activeTaskCount < min.activeTaskCount ? current : min
    );

    // Assign task to user with minimum active tasks
    task.assignedUser = userWithMinTasks.user._id;
    await task.save();
    await task.populate(['assignedUser', 'createdBy'], 'name email avatar');

    // Log activity
    const activity = new Activity({
      user: req.user._id,
      action: 'assigned',
      taskId: task._id,
      taskTitle: task.title,
      details: `Smart assigned task "${task.title}" to ${userWithMinTasks.user.name}`
    });
    await activity.save();
    await activity.populate('user', 'name email avatar');

    // Emit socket events for real-time updates
    req.io.to('main-board').emit('task-assigned', task);
    req.io.to('main-board').emit('activity-added', activity);

    res.json(task);
  } catch (error) {
    console.error('Smart assign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
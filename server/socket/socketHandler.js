import Task from '../models/Task.js';
import Activity from '../models/Activity.js';

export const handleSocketConnection = (socket, io) => {
  console.log(`User ${socket.user.name} connected`);

  // Join user to main board room
  socket.join('main-board');

  // Handle task updates
  socket.on('task-update', async (data) => {
    try {
      const { taskId, updates, version } = data;

      const task = await Task.findById(taskId);
      if (!task) {
        socket.emit('error', { message: 'Task not found' });
        return;
      }

      // Check for version conflicts
      if (version && task.version !== version) {
        socket.emit('conflict', {
          taskId,
          currentVersion: task.version,
          yourVersion: version,
          currentTask: task,
          yourUpdates: updates
        });
        return;
      }

      // Apply updates
      Object.assign(task, updates);
      task.lastModified = new Date();
      task.version += 1;

      await task.save();
      await task.populate(['assignedUser', 'createdBy'], 'name email avatar');

      // Log activity
      const activity = new Activity({
        user: socket.user._id,
        action: 'updated',
        taskId: task._id,
        taskTitle: task.title,
        details: `Updated task "${task.title}"`
      });
      await activity.save();
      await activity.populate('user', 'name email avatar');

      // Broadcast to all users in the board
      io.to('main-board').emit('task-updated', task);
      io.to('main-board').emit('activity-added', activity);

    } catch (error) {
      console.error('Task update error:', error);
      socket.emit('error', { message: 'Failed to update task' });
    }
  });

  // Handle task status changes (drag and drop)
  socket.on('task-status-change', async (data) => {
    try {
      const { taskId, newStatus, newIndex } = data;

      const task = await Task.findById(taskId);
      if (!task) {
        socket.emit('error', { message: 'Task not found' });
        return;
      }

      const oldStatus = task.status;
      task.status = newStatus;
      task.lastModified = new Date();
      task.version += 1;

      await task.save();
      await task.populate(['assignedUser', 'createdBy'], 'name email avatar');

      // Log activity
      const activity = new Activity({
        user: socket.user._id,
        action: 'moved',
        taskId: task._id,
        taskTitle: task.title,
        details: `Moved task "${task.title}" from ${oldStatus} to ${newStatus}`
      });
      await activity.save();
      await activity.populate('user', 'name email avatar');

      // Broadcast to all users in the board
      io.to('main-board').emit('task-moved', {
        task,
        oldStatus,
        newStatus,
        newIndex
      });
      io.to('main-board').emit('activity-added', activity);

    } catch (error) {
      console.error('Task status change error:', error);
      socket.emit('error', { message: 'Failed to update task status' });
    }
  });

  // Handle task creation
  socket.on('task-created', async (task) => {
    try {
      // Broadcast to all users in the board (including sender for consistency)
      io.to('main-board').emit('task-created', task);
    } catch (error) {
      console.error('Task creation broadcast error:', error);
    }
  });

  // Handle task assignment
  socket.on('task-assigned', async (task) => {
    try {
      // Broadcast to all users in the board (including sender for consistency)
      io.to('main-board').emit('task-assigned', task);
    } catch (error) {
      console.error('Task assignment broadcast error:', error);
    }
  });

  // Handle task deletion
  socket.on('task-delete', async (data) => {
    try {
      const { taskId } = data;

      const task = await Task.findById(taskId);
      if (!task) {
        socket.emit('error', { message: 'Task not found' });
        return;
      }

      // Log activity before deletion
      const activity = new Activity({
        user: socket.user._id,
        action: 'deleted',
        taskId: task._id,
        taskTitle: task.title,
        details: `Deleted task "${task.title}" via real-time`
      });
      await activity.save();
      await activity.populate('user', 'name email avatar');

      await Task.findByIdAndDelete(taskId);

      // Broadcast to all users in the board
      io.to('main-board').emit('task-deleted', { taskId });
      io.to('main-board').emit('activity-added', activity);

    } catch (error) {
      console.error('Task deletion error:', error);
      socket.emit('error', { message: 'Failed to delete task' });
    }
  });

  // Handle conflict resolution
  socket.on('resolve-conflict', async (data) => {
    try {
      const { taskId, resolution, updates } = data;

      const task = await Task.findById(taskId);
      if (!task) {
        socket.emit('error', { message: 'Task not found' });
        return;
      }

      if (resolution === 'overwrite') {
        // Apply the user's updates
        Object.assign(task, updates);
        task.lastModified = new Date();
        task.version += 1;

        await task.save();
        await task.populate(['assignedUser', 'createdBy'], 'name email avatar');

        // Log activity
        const activity = new Activity({
          user: socket.user._id,
          action: 'updated',
          taskId: task._id,
          taskTitle: task.title,
          details: `Resolved conflict and updated task "${task.title}"`
        });
        await activity.save();
        await activity.populate('user', 'name email avatar');

        // Broadcast to all users in the board
        io.to('main-board').emit('task-updated', task);
        io.to('main-board').emit('activity-added', activity);
      }
      // If resolution is 'keep-current', do nothing

    } catch (error) {
      console.error('Conflict resolution error:', error);
      socket.emit('error', { message: 'Failed to resolve conflict' });
    }
  });

  // Handle smart assignment updates
  socket.on('task-smart-assign', async (data) => {
    try {
      const { taskId } = data;

      const task = await Task.findById(taskId);
      if (!task) {
        socket.emit('error', { message: 'Task not found' });
        return;
      }

      await task.populate(['assignedUser', 'createdBy'], 'name email avatar');

      // Log activity for smart assignment
      const activity = new Activity({
        user: socket.user._id,
        action: 'assigned',
        taskId: task._id,
        taskTitle: task.title,
        details: `Smart assigned task "${task.title}" to ${task.assignedUser?.name || 'a user'}`
      });
      await activity.save();
      await activity.populate('user', 'name email avatar');

      // Broadcast to all users in the board
      io.to('main-board').emit('task-assigned', task);
      io.to('main-board').emit('activity-added', activity);

    } catch (error) {
      console.error('Smart assign broadcast error:', error);
      socket.emit('error', { message: 'Failed to broadcast smart assignment' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User ${socket.user.name} disconnected`);
  });
};
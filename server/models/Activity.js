import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['created', 'updated', 'deleted', 'moved', 'assigned', 'completed']
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  taskTitle: {
    type: String,
    required: true
  },
  details: {
    type: String,
    default: ''
  },
  boardId: {
    type: String,
    default: 'main-board'
  }
}, {
  timestamps: true
});

export default mongoose.model('Activity', activitySchema);
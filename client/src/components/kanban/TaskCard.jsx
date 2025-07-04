import { Draggable } from "react-beautiful-dnd";
import { Edit2, Trash2, User, Clock, Zap } from "lucide-react";

const priorityColors = {
  Low: "bg-green-100 text-green-800",
  Medium: "bg-yellow-100 text-yellow-800",
  High: "bg-red-100 text-red-800",
};

const priorityIcons = {
  Low: "●",
  Medium: "●●",
  High: "●●●",
};

export default function TaskCard({
  task,
  index,
  users,
  onEdit,
  onDelete,
  onSmartAssign,
}) {
  const assignedUser = users.find((u) => u._id === task.assignedUser);
  const createdBy = users.find((u) => u._id === task.createdBy);

  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`card p-4 cursor-grab active:cursor-grabbing transition-all duration-200 select-none ${
            snapshot.isDragging
              ? "shadow-lg rotate-1 scale-105 bg-white z-50"
              : "hover:shadow-md"
          }`}
          style={{
            ...provided.draggableProps.style,
            userSelect: "none",
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <h4 className="font-medium text-slate-900 flex-1 mr-2">
              {task.title}
            </h4>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => onEdit(task)}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <Edit2 className="h-4 w-4 text-slate-500" />
              </button>
              <button
                onClick={() => onDelete(task._id)}
                className="p-1 hover:bg-red-100 rounded"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </button>
            </div>
          </div>

          {task.description && (
            <p className="text-sm text-slate-600 mb-3 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  priorityColors[task.priority]
                }`}
              >
                {priorityIcons[task.priority]} {task.priority}
              </span>

              {assignedUser ? (
                <div className="flex items-center space-x-1">
                  <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="h-3 w-3 text-primary-600" />
                  </div>
                  <span className="text-xs text-slate-600">
                    {assignedUser.name}
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => onSmartAssign(task._id)}
                  className="flex items-center space-x-1 text-xs text-primary-600 hover:text-primary-800"
                >
                  <Zap className="h-3 w-3" />
                  <span>Smart Assign</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-1 text-xs text-slate-500">
              <Clock className="h-3 w-3" />
              <span>{new Date(task.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {createdBy && (
            <div className="mt-2 pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                Created by {createdBy.name}
              </span>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}

import { forwardRef } from "react";
import TaskCard from "./TaskCard";

const KanbanColumn = forwardRef(
  (
    {
      column,
      tasks,
      users,
      isDraggingOver,
      onEditTask,
      onDeleteTask,
      onSmartAssign,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        {...props}
        className={`rounded-lg p-4 transition-colors duration-200 border-2 ${
          isDraggingOver
            ? "bg-primary-50 border-dashed border-primary-300 shadow-inner"
            : `${column.color} border-transparent`
        }`}
        style={{ minHeight: "300px" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">{column.title}</h3>
          <span className="text-sm text-slate-500 bg-white px-2 py-1 rounded-full">
            {tasks.length}
          </span>
        </div>

        <div className="space-y-3 min-h-[200px]">
          {tasks.map((task, index) => (
            <TaskCard
              key={task._id}
              task={task}
              index={index}
              users={users}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onSmartAssign={onSmartAssign}
            />
          ))}
          {/* This placeholder is required by react-beautiful-dnd */}
          {props.children}
        </div>
      </div>
    );
  }
);

KanbanColumn.displayName = "KanbanColumn";

export default KanbanColumn;

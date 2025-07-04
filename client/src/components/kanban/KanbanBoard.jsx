import { DragDropContext, Droppable } from "react-beautiful-dnd";
import KanbanColumn from "./KanbanColumn";

const columns = [
  { id: "Todo", title: "To Do", color: "bg-slate-100" },
  { id: "In Progress", title: "In Progress", color: "bg-blue-100" },
  { id: "Done", title: "Done", color: "bg-green-100" },
];

export default function KanbanBoard({
  tasks,
  users,
  onTaskMove,
  onEditTask,
  onDeleteTask,
  onSmartAssign,
}) {
  const handleDragEnd = (result) => {
    console.log("Drag end result:", result);

    if (!result.destination) {
      console.log("No destination - drag cancelled");
      return;
    }

    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;

    console.log("Moving task:", draggableId, "to status:", newStatus);

    // Find the task being moved
    const task = tasks.find((t) => t._id === draggableId);
    if (!task || task.status === newStatus) {
      console.log("Task not found or status unchanged");
      return;
    }

    // Optimistically update the UI
    onTaskMove(draggableId, newStatus);
  };

  const getTasksByStatus = (status) => {
    return tasks.filter((task) => task.status === status);
  };

  return (
    <div className="p-6">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((column) => (
            <Droppable key={column.id} droppableId={column.id}>
              {(provided, snapshot) => (
                <KanbanColumn
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  column={column}
                  tasks={getTasksByStatus(column.id)}
                  users={users}
                  isDraggingOver={snapshot.isDraggingOver}
                  onEditTask={onEditTask}
                  onDeleteTask={onDeleteTask}
                  onSmartAssign={onSmartAssign}
                >
                  {provided.placeholder}
                </KanbanColumn>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}

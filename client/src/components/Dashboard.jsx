import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import KanbanBoard from "./kanban/KanbanBoard";
import ActivityPanel from "./activity/ActivityPanel";
import Header from "./layout/Header";
import CreateTaskModal from "./modals/CreateTaskModal";
import EditTaskModal from "./modals/EditTaskModal";
import ConflictModal from "./modals/ConflictModal";
import { toast } from "react-toastify";
import api from "../utils/api";

export default function Dashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [conflictData, setConflictData] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on("task-updated", (task) => {
        setTasks((prev) => prev.map((t) => (t._id === task._id ? task : t)));
      });

      socket.on("task-moved", ({ task, oldStatus, newStatus }) => {
        setTasks((prev) => prev.map((t) => (t._id === task._id ? task : t)));
      });

      socket.on("task-deleted", ({ taskId }) => {
        setTasks((prev) => prev.filter((t) => t._id !== taskId));
      });

      socket.on("activity-added", (activity) => {
        setActivities((prev) => [activity, ...prev.slice(0, 19)]);
      });

      socket.on("conflict", (data) => {
        setConflictData(data);
      });

      return () => {
        socket.off("task-updated");
        socket.off("task-moved");
        socket.off("task-deleted");
        socket.off("activity-added");
        socket.off("conflict");
      };
    }
  }, [socket]);

  const fetchInitialData = async () => {
    try {
      const [tasksRes, activitiesRes, usersRes] = await Promise.all([
        api.get("/tasks"),
        api.get("/activity"),
        api.get("/auth/users"),
      ]);

      setTasks(tasksRes.data);
      setActivities(activitiesRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      const response = await api.post("/tasks", taskData);
      setTasks((prev) => [response.data, ...prev]);
      setShowCreateModal(false);
      toast.success("Task created successfully!");
    } catch (error) {
      const message = error.response?.data?.message || "Failed to create task";
      toast.error(message);
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      const response = await api.put(`/tasks/${taskId}`, updates);
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? response.data : t))
      );
      setEditingTask(null);
      toast.success("Task updated successfully!");
    } catch (error) {
      const message = error.response?.data?.message || "Failed to update task";
      toast.error(message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      toast.success("Task deleted successfully!");
    } catch (error) {
      const message = error.response?.data?.message || "Failed to delete task";
      toast.error(message);
    }
  };

  const handleSmartAssign = async (taskId) => {
    try {
      const response = await api.post(`/tasks/${taskId}/smart-assign`);
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? response.data : t))
      );
      toast.success("Task assigned automatically!");
    } catch (error) {
      const message = error.response?.data?.message || "Failed to assign task";
      toast.error(message);
    }
  };

  const handleTaskMove = (taskId, newStatus) => {
    if (socket) {
      socket.emit("task-status-change", { taskId, newStatus });
    }
  };

  const handleResolveConflict = (resolution, updates) => {
    if (socket && conflictData) {
      socket.emit("resolve-conflict", {
        taskId: conflictData.taskId,
        resolution,
        updates,
      });
      setConflictData(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header onCreateTask={() => setShowCreateModal(true)} />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto">
          <KanbanBoard
            tasks={tasks}
            users={users}
            onTaskMove={handleTaskMove}
            onEditTask={(task) => setEditingTask(task)}
            onDeleteTask={handleDeleteTask}
            onSmartAssign={handleSmartAssign}
          />
        </div>

        <div className="w-80 bg-white border-l  border-slate-200 overflow-hidden">
          <ActivityPanel activities={activities} />
        </div>
      </div>

      {showCreateModal && (
        <CreateTaskModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateTask}
          users={users}
        />
      )}

      {editingTask && (
        <EditTaskModal
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          onSubmit={handleUpdateTask}
          task={editingTask}
          users={users}
        />
      )}

      {conflictData && (
        <ConflictModal
          isOpen={!!conflictData}
          onClose={() => setConflictData(null)}
          onResolve={handleResolveConflict}
          conflictData={conflictData}
        />
      )}
    </div>
  );
}

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
import { Activity, X } from "lucide-react"; // Import X for close icon

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { socket, connected } = useSocket();
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [conflictData, setConflictData] = useState(null);
  const [showActivityPanel, setShowActivityPanel] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch initial data
  useEffect(() => {
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

    fetchInitialData();
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (socket) {
      socket.on("task-updated", (task) => {
        setTasks((prev) => prev.map((t) => (t._id === task._id ? task : t)));
      });

      socket.on("task-moved", ({ task }) => {
        setTasks((prev) => prev.map((t) => (t._id === task._id ? task : t)));
      });

      socket.on("task-deleted", ({ taskId }) => {
        setTasks((prev) => prev.filter((t) => t._id !== taskId));
      });

      // This is the key listener for real-time activity updates
      socket.on("activity-added", (activity) => {
        setActivities((prev) => [activity, ...prev.slice(0, 19)]); // Keep latest 20 activities
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

  const handleCreateTask = async (taskData) => {
    try {
      const response = await api.post("/tasks", taskData);
      setTasks((prev) => [response.data, ...prev]);
      setShowCreateModal(false);
      toast.success("Task created successfully!");
      // Backend should emit 'activity-added' here
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
      // Backend should emit 'activity-added' here based on the 'updates'
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
      // Backend should emit 'activity-added' here
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

      // Emit socket event to broadcast the assignment to all users
      if (socket) {
        socket.emit("task-smart-assign", { taskId });
      }

      toast.success("Task assigned automatically!");
    } catch (error) {
      const message = error.response?.data?.message || "Failed to assign task";
      toast.error(message);
    }
  };

  const handleTaskMove = (taskId, newStatus) => {
    if (socket) {
      socket.emit("task-status-change", {
        taskId,
        newStatus,
        userId: user._id,
      });
      // Backend should process this and then emit 'task-updated' AND 'activity-added'
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

  const isMobile = windowWidth < 768;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        onCreateTask={() => setShowCreateModal(true)}
        onToggleActivity={() => setShowActivityPanel(!showActivityPanel)}
        showActivityToggle={isMobile}
      />

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 overflow-auto p-4">
          <KanbanBoard
            tasks={tasks}
            users={users}
            onTaskMove={handleTaskMove}
            onEditTask={(task) => setEditingTask(task)}
            onDeleteTask={handleDeleteTask}
            onSmartAssign={handleSmartAssign}
          />
        </div>

        {/* Desktop Activity Panel (Sidebar) */}
        {!isMobile && (
          <div className="w-80 bg-white border-l border-slate-200 h-[calc(100vh-64px)] overflow-auto">
            <ActivityPanel activities={activities} />
          </div>
        )}

        {/* Mobile Activity Panel (Bottom Sheet) */}
        {isMobile && (
          <>
            {/* Toggle Button for Mobile Activity Panel */}
            <button
              onClick={() => setShowActivityPanel(!showActivityPanel)}
              className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-30 p-3 px-6 rounded-full shadow-lg bg-primary-600 text-white flex items-center gap-2 transition-opacity duration-300 ${
                showActivityPanel
                  ? "opacity-0 pointer-events-none"
                  : "opacity-100"
              }`}
            >
              <Activity size={20} />
              <span>Activity</span>
            </button>

            {/* Overlay */}
            <div
              className={`fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity duration-300 ${
                showActivityPanel
                  ? "opacity-100"
                  : "opacity-0 pointer-events-none"
              }`}
              onClick={() => setShowActivityPanel(false)}
            />

            {/* Panel */}
            <div
              className={`fixed bottom-0 left-0 right-0 z-20 bg-white rounded-t-2xl shadow-xl transition-transform duration-300 ${
                showActivityPanel ? "translate-y-0" : "translate-y-full"
              }`}
              style={{ maxHeight: "80vh" }}
            >
              <div className="p-4 flex justify-between items-center border-b border-slate-200 sticky top-0 bg-white z-10">
                <h3 className="text-lg font-semibold text-slate-800">
                  Activity Log
                </h3>
                <button
                  onClick={() => setShowActivityPanel(false)}
                  className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                >
                  <X size={24} /> {/* Close icon */}
                </button>
              </div>
              <div
                className="overflow-auto"
                style={{ height: "calc(80vh - 56px)" }} // Adjust height based on header height
              >
                <ActivityPanel activities={activities} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
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

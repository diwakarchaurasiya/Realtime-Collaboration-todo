import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { Plus, User, LogOut, Wifi, WifiOff, Menu } from "lucide-react";
import { useState } from "react";

export default function Header({
  onCreateTask,
  onToggleActivity,
  showActivityToggle,
}) {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b border-slate-200">
      <div className="px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and connection status */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-sm"></div>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                Kanban Board
              </h1>
            </div>

            {/* Connection status - hidden on small mobile */}
            <div className="hidden sm:flex items-center space-x-2">
              {connected ? (
                <div className="flex items-center text-green-600">
                  <Wifi className="h-4 w-4 mr-1" />
                  <span className="text-sm">Connected</span>
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <WifiOff className="h-4 w-4 mr-1" />
                  <span className="text-sm">Disconnected</span>
                </div>
              )}
            </div>
          </div>

          {/* Right side - Actions and user */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Mobile menu button */}
            <button
              className="sm:hidden p-2 rounded-md hover:bg-slate-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-5 w-5 text-slate-600" />
            </button>

            {/* Add Task button - hidden on mobile when menu is open */}
            {(!mobileMenuOpen || !showActivityToggle) && (
              <button
                onClick={onCreateTask}
                className="btn-primary flex items-center py-2 px-3 sm:px-4"
              >
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Add Task</span>
              </button>
            )}

            {/* Activity toggle button for mobile/tablet */}
            {showActivityToggle && (
              <button
                onClick={onToggleActivity}
                className="sm:hidden p-2 rounded-md hover:bg-slate-100"
              >
                <Wifi className="h-5 w-5 text-slate-600" />
              </button>
            )}

            {/* Desktop user info */}
            <div className="hidden sm:flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-600" />
                </div>
                <span className="text-sm font-medium text-slate-700">
                  {user?.name}
                </span>
              </div>

              <button
                onClick={logout}
                className="btn-secondary flex items-center"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden mt-3 pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between">
              {/* Connection status - shown in mobile menu */}
              <div className="flex items-center space-x-2">
                {connected ? (
                  <div className="flex items-center text-green-600">
                    <Wifi className="h-4 w-4 mr-1" />
                    <span className="text-sm">Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <WifiOff className="h-4 w-4 mr-1" />
                    <span className="text-sm">Disconnected</span>
                  </div>
                )}
              </div>

              {/* User info and logout - shown in mobile menu */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-600" />
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="btn-secondary flex items-center py-2 px-3"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

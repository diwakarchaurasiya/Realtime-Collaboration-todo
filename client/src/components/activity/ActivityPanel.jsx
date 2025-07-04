import { Activity, User, Clock } from "lucide-react";

const actionIcons = {
  created: "✨",
  updated: "📝",
  deleted: "🗑️",
  moved: "🔄",
  assigned: "👤",
  completed: "✅",
};

const actionColors = {
  created: "text-green-600",
  updated: "text-blue-600",
  deleted: "text-red-600",
  moved: "text-purple-600",
  assigned: "text-orange-600",
  completed: "text-green-600",
};

export default function ActivityPanel({ activities }) {
  const formatTimeAgo = (date) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffInMinutes = Math.floor((now - activityDate) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="h-screen overflow-auto flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-slate-600" />
          <h3 className="font-semibold text-slate-900">Activity Feed</h3>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activities.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            <Activity className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p>No activities yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity._id}
                className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg animate-fade-in"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-sm">
                    {actionIcons[activity.action] || "📋"}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3 text-slate-400" />
                      <span className="text-sm font-medium text-slate-900">
                        {activity.user?.name || "Unknown User"}
                      </span>
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        actionColors[activity.action]
                      }`}
                    >
                      {activity.action}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 mt-1">
                    {activity.details}
                  </p>

                  <div className="flex items-center space-x-1 mt-2">
                    <Clock className="h-3 w-3 text-slate-400" />
                    <span className="text-xs text-slate-500">
                      {formatTimeAgo(activity.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

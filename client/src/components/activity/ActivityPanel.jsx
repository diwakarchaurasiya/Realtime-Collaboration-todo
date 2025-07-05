import {
  Activity,
  User,
  Clock,
  Sparkles,
  Edit,
  Trash2,
  RefreshCw,
  UserCheck,
  CheckCircle,
  FileText,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

// Icons for different activity actions
const actionIcons = {
  created: <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />,
  updated: <Edit className="h-3 w-3 sm:h-4 sm:w-4" />,
  deleted: <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />,
  moved: <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />,
  assigned: <UserCheck className="h-3 w-3 sm:h-4 sm:w-4" />,
  completed: <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />,
};

// Colors for different activity actions (subtle but indicative)
const actionColors = {
  created: "text-green-600",
  updated: "text-blue-600",
  deleted: "text-red-600",
  moved: "text-purple-600",
  assigned: "text-orange-600",
  completed: "text-green-600",
};

export default function ActivityPanel({ activities }) {
  // Formats a date into a human-readable "time ago" string
  const formatTimeAgo = (date) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffInMinutes = Math.floor((now - activityDate) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Generates a consistent, random color for a given user name
  const getUserColor = (userName) => {
    const colors = [
      "text-blue-600",
      "text-green-600",
      "text-purple-600",
      "text-pink-600",
      "text-indigo-600",
      "text-yellow-600",
      "text-red-600",
      "text-cyan-600",
      "text-orange-600",
      "text-teal-600",
    ];

    let hash = 0;
    for (let i = 0; i < userName.length; i++) {
      hash = userName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Formats activity details, making task titles bold
  const formatActivityDetails = (details) => {
    return details.replace(/task "([^"]+)"/g, "task **$1**");
  };

  // Renders the formatted activity details with bolded task titles
  const renderFormattedDetails = (details) => {
    const formattedDetails = formatActivityDetails(details);
    const parts = formattedDetails.split(/\*\*([^*]+)\*\*/);

    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          <span key={index} className="font-semibold text-slate-800">
            "{part}"
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Defines an order for task statuses to determine movement direction
  const getStatusOrder = (status) => {
    const statusOrder = { Todo: 0, "In Progress": 1, Done: 2 };
    return statusOrder[status] || 0;
  };

  // Determines the direction of task movement
  const getMovementDirection = (details) => {
    const match = details.match(/from (.+?) to (.+?)$/);
    if (!match) return null;

    const [, fromStatus, toStatus] = match;
    const fromOrder = getStatusOrder(fromStatus);
    const toOrder = getStatusOrder(toStatus);

    if (fromOrder < toOrder) return "forward";
    if (fromOrder > toOrder) return "backward";
    return "same";
  };

  // Renders a visual representation of task movement
  const renderMovementVisual = (details) => {
    const match = details.match(/from (.+?) to (.+?)$/);
    if (!match) return null;

    const [, fromStatus, toStatus] = match;
    const direction = getMovementDirection(details);

    const statusColors = {
      Todo: "bg-slate-100 text-slate-700",
      "In Progress": "bg-blue-100 text-blue-700",
      Done: "bg-green-100 text-green-700",
    };

    const getArrowIcon = () => {
      switch (direction) {
        case "forward":
          return <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />;
        case "backward":
          return <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />;
        default:
          return <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />;
      }
    };

    return (
      <div className="flex items-center space-x-2 mt-2">
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium ${
            statusColors[fromStatus] || "bg-gray-100 text-gray-700"
          }`}
        >
          {fromStatus}
        </span>
        {getArrowIcon()}
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium ${
            statusColors[toStatus] || "bg-gray-100 text-gray-700"
          }`}
        >
          {toStatus}
        </span>
      </div>
    );
  };

  return (
    <div className="h-full overflow-hidden flex flex-col">
      {/* Header for the Activity Feed panel */}
      <div className="p-3 sm:p-4 border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-slate-600" />
          <h3 className="font-semibold text-slate-900 text-base sm:text-lg">
            Activity Feed
          </h3>
        </div>
      </div>

      {/* Scrollable area for activities */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4">
        {activities.length === 0 ? (
          <div className="text-center text-slate-500 py-6 sm:py-8">
            <Activity className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 text-slate-300" />
            <p className="text-sm sm:text-base">No activities yet.</p>
            <p className="text-xs sm:text-sm text-slate-400">
              Start by creating or updating tasks!
            </p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {activities.map((activity, index) => (
              <div
                key={activity._id || index}
                className={`flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 bg-white rounded-lg shadow-xs sm:shadow-sm border border-slate-100 ${
                  index === 0 ? "border-blue-200" : ""
                }`}
              >
                {/* Icon representing the activity type */}
                <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-slate-50 rounded-full flex items-center justify-center shadow-xs border border-slate-100">
                  <div className={`${actionColors[activity.action]}`}>
                    {actionIcons[activity.action] || (
                      <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                    )}
                  </div>
                </div>

                {/* Activity details content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-slate-700">
                    <div className="flex items-center space-x-1">
                      <User
                        className={`h-3 w-3 sm:h-4 sm:w-4 ${getUserColor(
                          activity.user?.name || "Unknown User"
                        )}`}
                      />
                      <span
                        className={`font-semibold ${getUserColor(
                          activity.user?.name || "Unknown User"
                        )}`}
                      >
                        {activity.user?.name || "Unknown User"}
                      </span>
                    </div>
                    <span
                      className={`font-medium ${actionColors[activity.action]}`}
                    >
                      {activity.action}
                    </span>
                  </div>

                  <div className="text-xs sm:text-sm text-slate-700 mt-1 leading-snug">
                    {renderFormattedDetails(activity.details)}
                  </div>

                  {activity.action === "moved" &&
                    renderMovementVisual(activity.details)}

                  <div className="flex items-center space-x-1 mt-1 sm:mt-2 text-slate-500">
                    <Clock className="h-3 w-3 sm:h-3 sm:w-3" />
                    <span className="text-xs">
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

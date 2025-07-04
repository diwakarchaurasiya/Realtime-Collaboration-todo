import { X, AlertTriangle } from 'lucide-react'

export default function ConflictModal({ isOpen, onClose, onResolve, conflictData }) {
  if (!isOpen || !conflictData) return null

  const { currentTask, yourUpdates } = conflictData

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
            Conflict Detected
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>
        
        <div className="space-y-4">
          <p className="text-slate-600">
            Another user has modified this task while you were editing it. 
            Please choose how to proceed:
          </p>
          
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="font-medium text-slate-900 mb-2">Current Version (on server):</h3>
            <div className="space-y-1 text-sm">
              <p><strong>Title:</strong> {currentTask.title}</p>
              <p><strong>Description:</strong> {currentTask.description || 'No description'}</p>
              <p><strong>Priority:</strong> {currentTask.priority}</p>
              <p><strong>Status:</strong> {currentTask.status}</p>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-slate-900 mb-2">Your Changes:</h3>
            <div className="space-y-1 text-sm">
              {yourUpdates.title && <p><strong>Title:</strong> {yourUpdates.title}</p>}
              {yourUpdates.description !== undefined && <p><strong>Description:</strong> {yourUpdates.description || 'No description'}</p>}
              {yourUpdates.priority && <p><strong>Priority:</strong> {yourUpdates.priority}</p>}
              {yourUpdates.status && <p><strong>Status:</strong> {yourUpdates.status}</p>}
            </div>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              onClick={() => onResolve('keep-current')}
              className="btn-secondary flex-1"
            >
              Keep Current Version
            </button>
            <button
              onClick={() => onResolve('overwrite', yourUpdates)}
              className="btn-primary flex-1"
            >
              Apply My Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
import React from 'react';
import { Plus, MessageSquare, Trash2, X } from 'lucide-react';
import { ChatSession } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  isOpen: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  isOpen
}) => {
  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full bg-black text-gray-300 p-3">
      <div className="mb-4">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg shadow-blue-900/20"
        >
          <Plus size={18} />
          <span className="text-sm font-medium">New chat</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
        <div className="text-xs font-semibold text-gray-500 px-2 py-2 uppercase tracking-wider">
            Recent
        </div>
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            className={`group w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors text-left relative overflow-hidden ${
              session.id === currentSessionId
                ? 'bg-gray-900 text-white'
                : 'text-gray-400 hover:bg-gray-900/50 hover:text-gray-200'
            }`}
          >
            <MessageSquare size={16} className={`flex-shrink-0 ${session.id === currentSessionId ? 'text-blue-500' : 'text-gray-500'}`} />
            <span className="truncate flex-1 pr-6">
              {session.title || 'New Chat'}
            </span>
            
            {/* Delete button only visible on hover or active */}
            <div 
                className={`absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity ${
                    session.id === currentSessionId ? 'opacity-100' : ''
                }`}
                onClick={(e) => onDeleteSession(session.id, e)}
            >
                <div className="p-1.5 hover:bg-gray-800 rounded text-gray-500 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                </div>
            </div>
            
            {/* Fade effect for text truncation */}
            <div className={`absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l ${
                 session.id === currentSessionId ? 'from-gray-900' : 'from-black group-hover:from-gray-900'
            } to-transparent pointer-events-none group-hover:w-8`} />
          </button>
        ))}
        {sessions.length === 0 && (
            <div className="text-center text-sm text-gray-600 py-4">
                No chat history
            </div>
        )}
      </div>

      <div className="pt-4 mt-auto border-t border-gray-800">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-900 transition-colors cursor-pointer">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
            U
          </div>
          <div className="flex flex-col">
             <span className="text-sm font-medium text-white">User</span>
             <span className="text-xs text-gray-500">Free Plan</span>
          </div>
        </div>
      </div>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { Sidebar } from './components/Sidebar';
import { ChatSession, Message } from './types';
import { v4 as uuidv4 } from 'uuid';
import { Menu } from 'lucide-react';

const STORAGE_KEY = 'gemini_chat_history_v1';

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Load history on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSessions(parsed);
        if (parsed.length > 0) {
          setCurrentSessionId(parsed[0].id);
        }
      } catch (e) {
        console.error("Failed to load history", e);
      }
    } else {
      createNewSession();
    }
  }, []);

  // Save history on change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: uuidv4(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
    }
  };

  const updateSession = (sessionId: string, updater: (session: ChatSession) => ChatSession) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? updater(s) : s));
  };

  const deleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions(prev => {
        const filtered = prev.filter(s => s.id !== sessionId);
        if (currentSessionId === sessionId) {
            setCurrentSessionId(filtered.length > 0 ? filtered[0].id : null);
        }
        return filtered;
    });
    // If we deleted the last one, create a new one immediately
    if (sessions.length === 1 && sessions[0].id === sessionId) {
        // We can't call createNewSession directly here because of the async nature of setState
        // But the effect regarding empty sessions might handle it, or we force it:
        const newId = uuidv4();
        setSessions([{
             id: newId,
             title: 'New Chat',
             messages: [],
             createdAt: Date.now(),
             updatedAt: Date.now(),
        }]);
        setCurrentSessionId(newId);
    }
  };

  const currentSession = sessions.find(s => s.id === currentSessionId) || sessions[0];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen w-full bg-gray-950 overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/70 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:relative z-30 h-full bg-black text-gray-100 transition-all duration-300 ease-in-out border-r border-gray-800
        ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:w-0 md:translate-x-0'}
      `}>
        <Sidebar 
          sessions={sessions} 
          currentSessionId={currentSessionId}
          onSelectSession={(id) => {
            setCurrentSessionId(id);
            if (window.innerWidth < 768) setIsSidebarOpen(false);
          }}
          onNewChat={createNewSession}
          onDeleteSession={deleteSession}
          isOpen={isSidebarOpen}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative min-w-0 bg-gray-950">
        <header className="flex items-center p-4 border-b border-gray-800 bg-gray-950 z-10">
          <button 
            onClick={toggleSidebar}
            className="p-2 -ml-2 mr-2 rounded-md hover:bg-gray-800 text-gray-400 focus:outline-none transition-colors"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-lg font-semibold text-gray-100 truncate">
            {currentSession?.title || 'THINK Chat'}
          </h1>
        </header>
        
        <main className="flex-1 overflow-hidden relative">
          {currentSession ? (
            <ChatInterface 
              key={currentSession.id} // Force remount on session switch for clean state
              session={currentSession}
              onUpdateSession={(updater) => updateSession(currentSession.id, updater)}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
                Loading...
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
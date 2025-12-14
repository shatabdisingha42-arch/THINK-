import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, StopCircle, RefreshCw, Loader2, Image as ImageIcon } from 'lucide-react';
import { ChatSession, Message } from '../types';
import { geminiService } from '../services/geminiService';
import { MessageItem } from './MessageItem';
import { v4 as uuidv4 } from 'uuid';

interface ChatInterfaceProps {
  session: ChatSession;
  onUpdateSession: (updater: (s: ChatSession) => ChatSession) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ session, onUpdateSession }) => {
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session.messages.length, isGenerating]);

  // Initialize service with history when session changes
  useEffect(() => {
    // We only pass completed messages to history context
    const completedMessages = session.messages.filter(m => !m.isStreaming);
    geminiService.startChat(completedMessages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id]); // Only re-init on session switch

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const updateLastMessage = useCallback((content: string, isStreaming: boolean) => {
    onUpdateSession(prev => {
        const newMessages = [...prev.messages];
        if (newMessages.length > 0) {
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg.role === 'model') {
                newMessages[newMessages.length - 1] = {
                    ...lastMsg,
                    content,
                    isStreaming
                };
            }
        }
        return { ...prev, messages: newMessages, updatedAt: Date.now() };
    });
  }, [onUpdateSession]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isGenerating) return;

    const trimmedInput = input.trim();
    const isImageRequest = trimmedInput.toLowerCase().startsWith('/image');

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: trimmedInput,
      timestamp: Date.now(),
    };

    // Optimistic update for user message
    onUpdateSession(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      // Update title if it's the first message
      title: prev.messages.length === 0 ? userMessage.content.slice(0, 30) + (userMessage.content.length > 30 ? '...' : '') : prev.title,
      updatedAt: Date.now()
    }));

    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsGenerating(true);
    setError(null);

    // Placeholder for AI message
    const aiMessageId = uuidv4();
    const initialAiMessage: Message = {
      id: aiMessageId,
      role: 'model',
      content: isImageRequest ? 'Generating image...' : '', // Start empty or with status
      timestamp: Date.now(),
      isStreaming: true
    };

    onUpdateSession(prev => ({
        ...prev,
        messages: [...prev.messages, initialAiMessage],
        updatedAt: Date.now()
    }));

    try {
        if (isImageRequest) {
            // Handle Image Generation
            const prompt = trimmedInput.slice(6).trim();
            if (!prompt) {
                 updateLastMessage("Please provide a description for the image after /image.", false);
            } else {
                 const result = await geminiService.generateImage(prompt);
                 updateLastMessage(result, false);
            }
        } else {
            // Handle Text Chat
            let fullResponse = '';
            const stream = geminiService.sendMessageStream(userMessage.content);
            
            for await (const chunk of stream) {
                fullResponse += chunk;
                updateLastMessage(fullResponse, true);
            }
            
            // Finalize
            updateLastMessage(fullResponse, false);
        }

    } catch (err: any) {
        console.error(err);
        setError("Failed to generate response. Please check your API key and try again.");
        updateLastMessage("Sorry, I encountered an error processing your request.", false);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 relative">
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32">
        {session.messages.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50 mt-20">
              <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center">
                 <RefreshCw className="w-8 h-8 text-blue-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-400">How can I help you today?</h2>
              <p className="text-sm text-gray-500">Try "/image a cyberpunk city"</p>
           </div>
        ) : (
            <>
                {session.messages.map((msg) => (
                    <MessageItem key={msg.id} message={msg} />
                ))}
                {error && (
                    <div className="p-4 rounded-md bg-red-900/20 border border-red-900 text-red-400 text-sm mx-auto max-w-3xl">
                        {error}
                    </div>
                )}
                <div ref={messagesEndRef} />
            </>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-950 via-gray-950 to-transparent pt-10 pb-6 px-4">
        <div className="max-w-3xl mx-auto relative">
           <form onSubmit={handleSubmit} className="relative shadow-2xl rounded-2xl border border-gray-800 bg-gray-900 focus-within:ring-2 focus-within:ring-blue-600/50 transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Message THINK... (Type /image for images)"
                className="w-full py-4 pl-4 pr-12 bg-transparent border-none focus:ring-0 resize-none max-h-[200px] min-h-[56px] text-gray-100 placeholder-gray-500 leading-relaxed"
                rows={1}
                disabled={isGenerating}
              />
              <button
                type="submit"
                disabled={!input.trim() || isGenerating}
                className={`absolute right-2 bottom-2 p-2 rounded-lg transition-colors ${
                  !input.trim() || isGenerating 
                    ? 'text-gray-600 bg-transparent cursor-not-allowed' 
                    : 'text-white bg-blue-600 hover:bg-blue-500'
                }`}
              >
                {isGenerating ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
              </button>
           </form>
           <div className="text-center mt-2 text-xs text-gray-600">
             THINK can make mistakes. Consider checking important information.
           </div>
        </div>
      </div>
    </div>
  );
};
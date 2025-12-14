import React from 'react';
import ReactMarkdown from 'react-markdown';
import { User, Bot, Download } from 'lucide-react';
import { Message } from '../types';
import remarkGfm from 'remark-gfm';

interface MessageItemProps {
  message: Message;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-3xl w-full gap-4 p-4 rounded-xl ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-blue-600 text-white' : 'bg-gray-800 text-blue-400 border border-gray-700'
        }`}>
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-hidden ${isUser ? 'text-right' : 'text-left'}`}>
            <div className={`text-sm font-medium mb-1 ${isUser ? 'text-gray-300' : 'text-blue-400'}`}>
                {isUser ? 'You' : 'THINK'}
            </div>
            
            <div className={`prose prose-sm prose-invert max-w-none ${
                isUser 
                ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 inline-block text-left' 
                : 'text-gray-200'
            }`}>
                 {isUser ? (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                 ) : (
                    <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        // Allow data: URIs for images
                        urlTransform={(value) => value}
                        components={{
                            // Override styling for links to make them visible in dark mode
                            a: ({node, ...props}) => <a className="text-blue-400 hover:text-blue-300 underline" {...props} />,
                            // Code blocks
                            code({node, className, children, ...props}) {
                                const match = /language-(\w+)/.exec(className || '')
                                return match ? (
                                    <div className="relative my-4 rounded-md overflow-hidden bg-black border border-gray-800">
                                        <div className="flex items-center justify-between px-4 py-2 bg-gray-900 text-xs text-gray-400 border-b border-gray-800">
                                            <span>{match[1]}</span>
                                        </div>
                                        <pre className="p-4 overflow-x-auto text-gray-300 text-sm bg-black">
                                            <code className={className} {...props}>
                                                {children}
                                            </code>
                                        </pre>
                                    </div>
                                ) : (
                                    <code className="bg-gray-800 text-blue-300 px-1.5 py-0.5 rounded text-sm font-mono border border-gray-700" {...props}>
                                        {children}
                                    </code>
                                )
                            },
                            // Custom Image Renderer
                            img: ({node, src, alt, ...props}) => {
                                const imageSrc = typeof src === 'string' ? src : undefined;
                                if (!imageSrc) return null;
                                return (
                                    <div className="relative group inline-block max-w-full my-2">
                                        <img 
                                            src={imageSrc} 
                                            alt={alt} 
                                            className="rounded-lg shadow-lg max-w-full h-auto border border-gray-700 bg-gray-900" 
                                            {...props}
                                        />
                                        <a 
                                            href={imageSrc} 
                                            download={`generated-image-${Date.now()}.jpg`}
                                            className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                                            title="Download Image"
                                        >
                                            <Download size={16} />
                                        </a>
                                    </div>
                                );
                            }
                        }}
                    >
                        {message.content}
                    </ReactMarkdown>
                 )}
                 {message.isStreaming && (
                    <span className="inline-block w-2 h-4 ml-1 bg-blue-400 animate-pulse align-middle" />
                 )}
            </div>
        </div>
      </div>
    </div>
  );
};
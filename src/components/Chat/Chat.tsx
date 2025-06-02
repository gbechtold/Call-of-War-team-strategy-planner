import React, { useState, useRef, useEffect } from 'react';
import { useCollaboration } from '../../hooks/useCollaboration';
import { FaComments, FaPaperPlane, FaTimes, FaUser } from 'react-icons/fa';
import { format } from 'date-fns';

interface ChatMessage {
  id: string;
  author: string;
  message: string;
  timestamp: Date;
  isSystem?: boolean;
}

export const Chat: React.FC = () => {
  const { isConnected, username, roomCode, connectedPeers } = useCollaboration();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    // Reset unread count when chat is opened
    if (!isMinimized) {
      setUnreadCount(0);
    }
  }, [messages, isMinimized]);

  // Add system message when connected/disconnected
  useEffect(() => {
    if (isConnected) {
      const systemMessage: ChatMessage = {
        id: `sys-${Date.now()}`,
        author: 'System',
        message: `You joined room ${roomCode}`,
        timestamp: new Date(),
        isSystem: true
      };
      setMessages(prev => [...prev, systemMessage]);
    }
  }, [isConnected, roomCode]);

  // Listen for chat messages from collaboration
  useEffect(() => {
    const handleChatMessage = (message: any) => {
      if (message.type === 'chat_message') {
        const chatMessage: ChatMessage = {
          id: message.messageId,
          author: message.author,
          message: message.payload.message,
          timestamp: new Date(message.timestamp),
          isSystem: false
        };
        setMessages(prev => [...prev, chatMessage]);
        
        // Increment unread count if minimized
        if (isMinimized && message.author !== username) {
          setUnreadCount(prev => prev + 1);
        }
      } else if (message.type === 'user_joined') {
        const systemMessage: ChatMessage = {
          id: `sys-${Date.now()}-joined`,
          author: 'System',
          message: `${message.payload.username || 'A user'} joined the room`,
          timestamp: new Date(message.timestamp),
          isSystem: true
        };
        setMessages(prev => [...prev, systemMessage]);
      } else if (message.type === 'user_left') {
        const systemMessage: ChatMessage = {
          id: `sys-${Date.now()}-left`,
          author: 'System',
          message: `${message.payload.username || 'A user'} left the room`,
          timestamp: new Date(message.timestamp),
          isSystem: true
        };
        setMessages(prev => [...prev, systemMessage]);
      }
    };

    // Import webrtcManager to listen for messages
    import('../../utils/webrtc').then(({ webrtcManager }) => {
      webrtcManager.onMessage(handleChatMessage);
    });
  }, [isMinimized, username]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || !isConnected) return;

    const chatMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      author: username,
      message: inputMessage.trim(),
      timestamp: new Date(),
      isSystem: false
    };

    // Add to local messages
    setMessages(prev => [...prev, chatMessage]);

    // Broadcast to peers
    const { webrtcManager } = await import('../../utils/webrtc');
    webrtcManager.sendMessage({
      type: 'chat_message',
      payload: { message: inputMessage.trim() },
      timestamp: new Date(),
      author: username,
      messageId: chatMessage.id
    });

    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isConnected) return null;

  return (
    <div 
      ref={chatContainerRef}
      className={`fixed bottom-4 right-4 z-40 ${
        isMinimized ? 'w-16 h-16' : 'w-80 h-96'
      } transition-all duration-300`}
    >
      {isMinimized ? (
        // Minimized state - just show icon
        <button
          onClick={() => setIsMinimized(false)}
          className="w-full h-full bg-cod-accent text-cod-primary rounded-full shadow-2xl hover:bg-cod-accent/90 transition-colors flex items-center justify-center relative"
        >
          <FaComments size={24} />
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </button>
      ) : (
        // Expanded chat window
        <div className="bg-cod-secondary/95 backdrop-blur-sm rounded-lg shadow-2xl border-2 border-cod-accent/20 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-cod-accent/30">
            <div className="flex items-center gap-2">
              <FaComments className="text-cod-accent" />
              <h3 className="font-bebas text-cod-accent">Room Chat</h3>
              <span className="text-xs text-gray-400">
                ({connectedPeers + 1} users)
              </span>
            </div>
            <button
              onClick={() => setIsMinimized(true)}
              className="text-cod-accent hover:text-cod-accent/70 transition-colors"
            >
              <FaTimes />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`${
                  msg.isSystem
                    ? 'text-center text-xs text-gray-500 italic'
                    : msg.author === username
                    ? 'text-right'
                    : 'text-left'
                }`}
              >
                {msg.isSystem ? (
                  <span>{msg.message}</span>
                ) : (
                  <div className={`inline-block max-w-[70%] ${
                    msg.author === username ? 'order-2' : ''
                  }`}>
                    <div className={`text-xs ${
                      msg.author === username ? 'text-cod-accent' : 'text-gray-400'
                    } mb-1 flex items-center gap-1 ${
                      msg.author === username ? 'justify-end' : ''
                    }`}>
                      <FaUser size={8} />
                      <span>{msg.author}</span>
                      <span className="text-gray-500">
                        {format(msg.timestamp, 'HH:mm')}
                      </span>
                    </div>
                    <div className={`p-2 rounded-lg ${
                      msg.author === username
                        ? 'bg-cod-accent text-cod-primary'
                        : 'bg-cod-primary/50 text-gray-100'
                    }`}>
                      {msg.message}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-cod-accent/30">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 bg-cod-primary/50 border border-cod-accent/30 rounded text-gray-100 text-sm placeholder-gray-500 focus:border-cod-accent/50 focus:outline-none"
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim()}
                className="px-3 py-2 bg-cod-accent text-cod-primary rounded hover:bg-cod-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaPaperPlane />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
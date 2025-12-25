
import React, { useState, useEffect, useRef } from 'react';
import { Message, UserRole } from '../types';

interface ChatSupportProps {
  currentRole: UserRole;
  messages: Message[];
  onSendMessage: (text: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const ChatSupport: React.FC<ChatSupportProps> = ({ currentRole, messages, onSendMessage, isOpen, onClose }) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  return (
    <div className="fixed bottom-24 right-4 left-4 md:left-auto md:bottom-20 md:right-8 md:w-96 bg-white rounded-3xl shadow-2xl border flex flex-col z-[100] animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 rounded-t-3xl flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold">D</div>
          <div>
            <h3 className="font-bold text-sm">Suporte Delivora</h3>
            <p className="text-[10px] opacity-70">Sempre online para ajudar</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">✕</button>
      </div>

      {/* Messages */}
      <div className="flex-1 h-80 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-sm italic">
            Como podemos ajudar você hoje?
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderRole === currentRole;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                isMe ? 'bg-orange-500 text-white rounded-tr-none' : 'bg-white border text-gray-800 rounded-tl-none'
              }`}>
                {!isMe && <p className="text-[10px] font-bold opacity-60 mb-1">{msg.senderName} ({msg.senderRole})</p>}
                <p>{msg.text}</p>
                <p className={`text-[9px] mt-1 text-right ${isMe ? 'text-orange-100' : 'text-gray-400'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t bg-white rounded-b-3xl flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="flex-1 bg-gray-100 border-0 rounded-2xl px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500"
        />
        <button type="submit" className="bg-orange-500 text-white p-2 rounded-xl hover:bg-orange-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
        </button>
      </form>
    </div>
  );
};

export default ChatSupport;

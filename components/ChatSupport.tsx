
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
    <div className="fixed bottom-24 right-4 left-4 md:left-auto md:bottom-20 md:right-8 md:w-96 bg-white rounded-3xl shadow-2xl border border-indigo-100 flex flex-col z-[100] animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="bg-indigo-950 text-white p-4 rounded-t-3xl flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center font-bold shadow-lg">D</div>
          <div>
            <h3 className="font-bold text-sm">Suporte Duarte</h3>
            <p className="text-[10px] text-indigo-300">Inteligente & Humano</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">✕</button>
      </div>

      {/* Messages */}
      <div className="flex-1 h-80 overflow-y-auto p-4 space-y-3 bg-indigo-50/20">
        {messages.length === 0 && (
          <div className="text-center py-10 text-indigo-300 text-sm italic font-medium">
            Olá! Como a equipe Duarte pode ajudar?
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderRole === currentRole;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-indigo-50 text-indigo-950 rounded-tl-none shadow-sm'
              }`}>
                {!isMe && <p className="text-[10px] font-bold text-indigo-400 mb-1">{msg.senderName} ({msg.senderRole})</p>}
                <p className="leading-relaxed">{msg.text}</p>
                <p className={`text-[9px] mt-1 text-right ${isMe ? 'text-indigo-200' : 'text-indigo-300'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-indigo-50 bg-white rounded-b-3xl flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Escreva sua dúvida..."
          className="flex-1 bg-indigo-50/30 border-0 rounded-2xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-600 transition-all text-indigo-900"
        />
        <button type="submit" className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
        </button>
      </form>
    </div>
  );
};

export default ChatSupport;

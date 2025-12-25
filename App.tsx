
import React, { useState, useEffect } from 'react';
import { UserRole, Order, OrderStatus, Shop, ServiceType, Message, Location, PaymentMethod, User, UserStatus } from './types';
import { MOCK_ORDERS, MOCK_SHOPS } from './constants';
import UserView from './views/UserView';
import MerchantView from './views/MerchantView';
import DriverView from './views/DriverView';
import AdminView from './views/AdminView';
import LoginView from './views/LoginView';
import { StoreIcon, TruckIcon, UserIcon, AdminIcon } from './components/Icons';
import ChatSupport from './components/ChatSupport';
import VoiceAssistant from './components/VoiceAssistant';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS.map(o => ({
    ...o,
    destinationLocation: { lat: o.location!.lat + 0.01, lng: o.location!.lng + 0.01 }
  })));
  
  const [users, setUsers] = useState<User[]>([
    { id: 'u1', name: 'Carlos Silva', email: 'carlos@email.com', password: 'user123', phone: '(11) 98888-7777', role: UserRole.USER, status: UserStatus.ACTIVE, createdAt: new Date().toISOString() },
    { id: 'm1', name: 'Burger Galaxy', email: 'contato@burgergalaxy.com', password: 'merchant123', phone: '(11) 97777-6666', role: UserRole.MERCHANT, status: UserStatus.ACTIVE, createdAt: new Date().toISOString(), document: '12.345.678/0001-90' },
    { id: 'd1', name: 'Ricardo Santos', email: 'ricardo.driver@email.com', password: 'driver123', phone: '(11) 96666-5555', role: UserRole.DRIVER, status: UserStatus.ACTIVE, createdAt: new Date().toISOString(), document: '987.654.321-00', vehiclePlate: 'XYZ-9876' },
    { id: 'a1', name: 'Admin Delivora', email: 'admin@delivora.com', password: 'admin123', phone: '(11) 95555-4444', role: UserRole.ADMIN, status: UserStatus.ACTIVE, createdAt: new Date().toISOString() }
  ]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(order => order.id === orderId ? { ...order, status } : order));
  };
  
  const handleAddUser = (user: User) => setUsers(prev => [...prev, user]);
  
  const handleUpdateUser = (userId: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? ({ ...prev, ...updates }) : null);
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (currentUser?.id === userId) {
      alert("Você não pode excluir a si mesmo!");
      return;
    }
    confirm("Excluir usuário?") && setUsers(prev => prev.filter(u => u.id !== userId));
  };

  const handleRateOrder = (orderId: string, m?: number, d?: number) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, merchantRating: m, driverRating: d, ratedAt: new Date().toISOString() } : o));
  };

  const handleSendMessage = async (text: string) => {
    if (!currentUser) return;
    const newMessage: Message = { 
      id: Date.now().toString(), 
      senderId: currentUser.id, 
      senderName: currentUser.name, 
      senderRole: currentUser.role, 
      text, 
      timestamp: new Date().toISOString() 
    };
    setMessages(prev => [...prev, newMessage]);
    if (currentUser.role === UserRole.USER) {
      const aiResponse = await geminiService.getFastResponse(text);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        senderId: 'bot', 
        senderName: 'Assistente', 
        senderRole: UserRole.ADMIN, 
        text: aiResponse, 
        timestamp: new Date().toISOString() 
      }]);
    }
  };

  const handlePlaceOrder = (data: any, type: ServiceType, payment: PaymentMethod) => {
    if (!currentUser) return;
    const newOrder: Order = {
      id: `ORD-${Math.floor(Math.random()*900)+100}`,
      type, userId: currentUser.id, userName: currentUser.name, total: data.total || 15, status: OrderStatus.PENDING, createdAt: new Date().toISOString(),
      location: { lat: -23.5505, lng: -46.6333 }, destinationLocation: { lat: -23.56, lng: -46.64 },
      paymentMethod: payment, paymentStatus: payment === PaymentMethod.CASH ? 'WAITING' : 'PAID',
      ...(type === ServiceType.FOOD ? { shopId: data.shop.id, shopName: data.shop.name, items: data.items } : {})
    };
    setOrders(prev => [newOrder, ...prev]);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsChatOpen(false);
    setIsVoiceOpen(false);
  };

  if (!currentUser) {
    return <LoginView onLogin={setCurrentUser} availableUsers={users} />;
  }

  const renderContent = () => {
    switch (currentUser.role) {
      case UserRole.USER: return <UserView onPlaceOrder={handlePlaceOrder} onRateOrder={handleRateOrder} allOrders={orders} />;
      case UserRole.MERCHANT: return <MerchantView orders={orders.filter(o => o.type === ServiceType.FOOD)} onUpdateStatus={handleUpdateOrderStatus} />;
      case UserRole.DRIVER: return <DriverView orders={orders} onAcceptOrder={(id) => setOrders(prev => prev.map(o => o.id === id ? { ...o, driverId: currentUser.id } : o))} onUpdateStatus={handleUpdateOrderStatus} />;
      case UserRole.ADMIN: return <AdminView orders={orders} users={users} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-0 md:pt-20">
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md shadow-sm border-b z-50 px-4 py-2">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-100">D</div>
            <span className="text-2xl font-black text-gray-900 tracking-tight hidden sm:inline">Delivora</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-black text-gray-900">{currentUser.name}</p>
              <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">{currentUser.role}</p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-400 overflow-hidden border-2 border-white shadow-sm">
              {currentUser.avatar ? <img src={currentUser.avatar} alt="" /> : currentUser.name[0]}
            </div>
            <button 
              onClick={handleLogout}
              className="bg-gray-100 text-gray-500 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all"
              title="Sair"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </div>
      </nav>

      <div className="fixed bottom-24 right-6 md:bottom-8 md:right-8 flex flex-col gap-4 z-40">
        <button
          onClick={() => setIsVoiceOpen(true)}
          className="w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group relative"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
          <span className="absolute right-full mr-4 bg-gray-900 text-white text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Delivora Voice</span>
        </button>
        <button
          onClick={() => setIsChatOpen(true)}
          className="w-14 h-14 bg-gray-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group relative"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
          {messages.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-white animate-bounce">{messages.length}</span>}
        </button>
      </div>

      <ChatSupport currentRole={currentUser.role} messages={messages} onSendMessage={handleSendMessage} isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <VoiceAssistant isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} />

      <main className="max-w-6xl mx-auto p-4 md:pt-10">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;

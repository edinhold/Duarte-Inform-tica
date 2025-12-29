
import React, { useState, useEffect } from 'react';
import { UserRole, Order, OrderStatus, Shop, ServiceType, Message, Location, PaymentMethod, User, UserStatus, ApiSettings } from './types';
import { MOCK_ORDERS, MOCK_SHOPS } from './constants';
import UserView from './views/UserView';
import MerchantView from './views/MerchantView';
import DriverView from './views/DriverView';
import AdminView from './views/AdminView';
import LoginView from './views/LoginView';
import AdminLoginView from './views/AdminLoginView';
import { StoreIcon, TruckIcon, UserIcon, AdminIcon } from './components/Icons';
import ChatSupport from './components/ChatSupport';
import VoiceAssistant from './components/VoiceAssistant';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  
  const [paymentSettings, setPaymentSettings] = useState<ApiSettings>({
    paymentGateway: 'Stripe',
    apiKey: '', 
    webhookUrl: 'https://api.duartedelivery.com/webhooks/payments',
    commissionRate: 15.0,
    isSandbox: true,
    activeMethods: [PaymentMethod.PIX, PaymentMethod.CREDIT_CARD, PaymentMethod.CASH],
    prepaidEnabled: false,
    pricing: {
      baseFee: 5.00,
      perKmRate: 2.50,
      minFare: 10.00,
      regions: [
        { id: '1', name: 'Centro Histórico', surcharge: 3.00 },
        { id: '2', name: 'Zona Industrial', surcharge: 8.50 },
        { id: '3', name: 'Aeroporto', surcharge: 15.00 }
      ]
    }
  });

  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS.map(o => ({
    ...o,
    destinationLocation: { lat: o.location!.lat + 0.01, lng: o.location!.lng + 0.01 },
    driverLocation: o.location
  })));
  
  const [users, setUsers] = useState<User[]>([
    { id: 'sa1', name: 'Super Duarte', email: 'super@duarte.com', password: '123456', phone: '(11) 99999-9999', address: 'Quartel General Duarte', document: '000.000.000-00', role: UserRole.SUPER_ADMIN, status: UserStatus.ACTIVE, createdAt: new Date().toISOString(), walletBalance: 0, needsPasswordChange: true },
    { id: 'u1', name: 'Carlos Silva', email: 'carlos@email.com', password: 'user123', phone: '(11) 98888-7777', address: 'Rua das Flores, 123', document: '123.456.789-00', role: UserRole.USER, status: UserStatus.ACTIVE, createdAt: new Date().toISOString(), walletBalance: 150.00 },
    { id: 'm1', name: 'Burger Galaxy', email: 'contato@burgergalaxy.com', password: 'merchant123', phone: '(11) 97777-6666', address: 'Av. das Estrelas, 500', document: '12.345.678/0001-90', role: UserRole.MERCHANT, status: UserStatus.ACTIVE, createdAt: new Date().toISOString(), walletBalance: 25.00, shopName: 'Burger Galaxy' },
    { id: 'd1', name: 'Ricardo Santos', email: 'ricardo.driver@email.com', password: 'driver123', phone: '(11) 96666-5555', address: 'Bairro Industrial, 45', document: '987.654.321-00', role: UserRole.DRIVER, status: UserStatus.ACTIVE, createdAt: new Date().toISOString(), vehiclePlate: 'XYZ-9876', vehicleModel: 'Honda Titan', vehicleColor: 'Preto', vehicleType: 'MOTORCYCLE', walletBalance: 45.50 },
    { id: 'a1', name: 'Admin Duarte', email: 'admin@duartedelivery.com', password: '123456', phone: '(11) 95555-4444', role: UserRole.ADMIN, status: UserStatus.ACTIVE, createdAt: new Date().toISOString(), walletBalance: 0, needsPasswordChange: true }
  ]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdError, setPwdError] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setOrders(prev => prev.map(order => {
        if (order.driverId && [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.IN_TRANSIT].includes(order.status) && order.driverLocation && order.destinationLocation) {
          const step = 0.0001;
          const latDiff = order.destinationLocation.lat - order.driverLocation.lat;
          const lngDiff = order.destinationLocation.lng - order.driverLocation.lng;
          
          if (Math.abs(latDiff) < step && Math.abs(lngDiff) < step) return order;

          return {
            ...order,
            driverLocation: {
              lat: order.driverLocation.lat + (latDiff > 0 ? step : -step),
              lng: order.driverLocation.lng + (lngDiff > 0 ? step : -step)
            }
          };
        }
        return order;
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return setPwdError('A senha deve ter pelo menos 6 caracteres.');
    if (newPassword !== confirmPassword) return setPwdError('As senhas não coincidem.');
    if (newPassword === '123456') return setPwdError('Escolha uma senha diferente da padrão.');

    setUsers(prev => prev.map(u => u.id === currentUser?.id ? { ...u, password: newPassword, needsPasswordChange: false } : u));
    setCurrentUser(prev => prev ? ({ ...prev, password: newPassword, needsPasswordChange: false }) : null);
    
    setPwdError('');
    alert('Senha atualizada com sucesso! Acesso concedido.');
  };

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    if (status === OrderStatus.DELIVERED) {
      if (order.paymentMethod === PaymentMethod.WALLET) {
        setUsers(prev => prev.map(u => {
          if (u.id === order.userId) {
            return { ...u, walletBalance: u.walletBalance - order.total };
          }
          if (u.id === order.driverId) {
            const commission = order.total * (paymentSettings.commissionRate / 100);
            return { ...u, walletBalance: u.walletBalance + (order.total - commission) };
          }
          return u;
        }));

        if (currentUser) {
           if (currentUser.id === order.userId) {
             setCurrentUser(prev => prev ? ({ ...prev, walletBalance: prev.walletBalance - order.total }) : null);
           } else if (currentUser.id === order.driverId) {
             const commission = order.total * (paymentSettings.commissionRate / 100);
             setCurrentUser(prev => prev ? ({ ...prev, walletBalance: prev.walletBalance + (order.total - commission) }) : null);
           }
        }
      }
    }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };
  
  const handleTopUp = (amount: number) => {
    if (!currentUser) return;
    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, walletBalance: u.walletBalance + amount } : u));
    setCurrentUser(prev => prev ? ({ ...prev, walletBalance: prev.walletBalance + amount }) : null);
    alert(`R$ ${amount.toFixed(2)} adicionados à sua Carteira Duarte!`);
  };

  const handleAddUser = (user: User) => {
    setUsers(prev => [...prev, user]);
  };

  const handleUpdateUser = (userId: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
    if (currentUser?.id === userId) setCurrentUser(prev => prev ? ({ ...prev, ...updates }) : null);
  };

  const handleDeleteUser = (userId: string) => {
    if (currentUser?.id === userId) return alert("Você não pode excluir a si mesmo!");
    confirm("Tem certeza que deseja remover este usuário?") && setUsers(prev => prev.filter(u => u.id !== userId));
  };

  const handleRateOrder = (orderId: string, m?: number, d?: number) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, merchantRating: m, driverRating: d, ratedAt: new Date().toISOString() } : o));
  };

  const handleSendMessage = async (text: string) => {
    if (!currentUser) return;
    const newMessage: Message = { id: Date.now().toString(), senderId: currentUser.id, senderName: currentUser.name, senderRole: currentUser.role, text, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, newMessage]);
    if (currentUser.role === UserRole.USER) {
      const aiResponse = await geminiService.getFastResponse(text);
      setMessages(prev => [...prev, { id: Date.now().toString(), senderId: 'bot', senderName: 'Assistente', senderRole: UserRole.ADMIN, text: aiResponse, timestamp: new Date().toISOString() }]);
    }
  };

  const handlePlaceOrder = (data: any, type: ServiceType, payment: PaymentMethod) => {
    if (!currentUser) return;
    if (payment === PaymentMethod.WALLET && currentUser.walletBalance < data.total) return alert("Saldo insuficiente na carteira pré-paga!");

    const newOrder: Order = {
      id: `ORD-${Math.floor(Math.random()*900)+100}`,
      type, userId: currentUser.id, userName: currentUser.name, total: data.total, status: OrderStatus.PENDING, createdAt: new Date().toISOString(),
      location: { lat: -23.5505, lng: -46.6333 }, destinationLocation: { lat: -23.56, lng: -46.64 },
      driverLocation: { lat: -23.5505, lng: -46.6333 },
      paymentMethod: payment, paymentStatus: (payment === PaymentMethod.CASH || payment === PaymentMethod.WALLET) ? 'WAITING' : 'PAID',
      ...(type === ServiceType.FOOD ? { shopId: data.shop.id, shopName: data.shop.name, items: data.items } : {}),
      ...(type === ServiceType.RIDE ? { rideDetails: data.rideDetails } : {}),
      ...(type === ServiceType.PARCEL ? { parcelDetails: data.parcelDetails } : {})
    };
    
    // Se pagar com carteira, já desconta agora (Pré-pago do Cliente)
    if (payment === PaymentMethod.WALLET) {
       setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, walletBalance: u.walletBalance - data.total } : u));
       setCurrentUser(prev => prev ? ({ ...prev, walletBalance: prev.walletBalance - data.total }) : null);
    }

    setOrders(prev => [newOrder, ...prev]);
  };

  const handlePlaceManualOrder = (data: any) => {
    if (!currentUser) return;
    
    // Débito imediato do saldo logístico do lojista (Pré-pago do Lojista)
    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, walletBalance: u.walletBalance - data.total } : u));
    setCurrentUser(prev => prev ? ({ ...prev, walletBalance: prev.walletBalance - data.total }) : null);

    const manualOrder: Order = {
      id: `MAN-${Math.floor(Math.random()*900)+100}`,
      type: ServiceType.PARCEL,
      shopId: currentUser.id,
      shopName: currentUser.name,
      userId: currentUser.id,
      userName: data.recipientName,
      total: data.total,
      status: OrderStatus.READY,
      createdAt: new Date().toISOString(),
      location: { lat: -23.5505, lng: -46.6333 },
      destinationLocation: { lat: -23.56, lng: -46.64 },
      paymentMethod: PaymentMethod.WALLET, // Considerado pago pela carteira do lojista
      paymentStatus: 'PAID',
      parcelDetails: {
        description: data.description,
        weight: 'N/A',
        destination: data.deliveryAddress
      }
    };
    setOrders(prev => [manualOrder, ...prev]);
  };

  const updatePaymentSettings = (newSettings: ApiSettings) => {
    const isConfigured = newSettings.apiKey.length > 5;
    const updatedMethods = isConfigured 
      ? Array.from(new Set([...newSettings.activeMethods, PaymentMethod.WALLET]))
      : newSettings.activeMethods.filter(m => m !== PaymentMethod.WALLET);

    setPaymentSettings({ 
      ...newSettings, 
      activeMethods: updatedMethods,
      prepaidEnabled: isConfigured 
    });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowAdminLogin(false);
    setIsChatOpen(false);
    setIsVoiceOpen(false);
    setNewPassword('');
    setConfirmPassword('');
    setPwdError('');
  };

  if (!currentUser) {
    if (showAdminLogin) return <AdminLoginView onLogin={setCurrentUser} onBack={() => setShowAdminLogin(false)} availableUsers={users} />;
    return <LoginView onLogin={setCurrentUser} onAdminAccess={() => setShowAdminLogin(true)} availableUsers={users} onRegister={handleAddUser} />;
  }

  if (currentUser.needsPasswordChange) {
    return (
      <div className="fixed inset-0 bg-indigo-950 flex items-center justify-center p-4 z-[200] animate-in fade-in duration-500">
        <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl border border-indigo-900/20 space-y-8">
           <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center text-white text-3xl mx-auto shadow-xl">🛡️</div>
              <h2 className="text-2xl font-black text-indigo-950">Segurança de Duarte</h2>
              <p className="text-indigo-300 text-sm font-bold uppercase tracking-widest">Troca de Senha Obrigatória</p>
           </div>
           
           <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-1">
                 <label className="text-[10px] font-black text-indigo-400 uppercase ml-2 tracking-widest">Nova Senha</label>
                 <input 
                    type="password" 
                    required 
                    className="w-full bg-indigo-50 border-0 rounded-2xl p-4 focus:ring-4 focus:ring-indigo-100 transition-all font-mono"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                 />
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-black text-indigo-400 uppercase ml-2 tracking-widest">Confirmar Nova Senha</label>
                 <input 
                    type="password" 
                    required 
                    className="w-full bg-indigo-50 border-0 rounded-2xl p-4 focus:ring-4 focus:ring-indigo-100 transition-all font-mono"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                 />
              </div>

              {pwdError && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] font-black uppercase text-center border border-red-100">
                   ⚠️ {pwdError}
                </div>
              )}

              <button type="submit" className="w-full bg-indigo-900 text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-black transition-all">
                 Definir Nova Senha
              </button>
           </form>

           <div className="text-center">
              <button onClick={handleLogout} className="text-[10px] font-bold text-indigo-200 hover:text-indigo-400 transition-colors uppercase tracking-widest">
                 Sair do Sistema
              </button>
           </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentUser.role) {
      case UserRole.USER: return <UserView onPlaceOrder={handlePlaceOrder} onRateOrder={handleRateOrder} allOrders={orders} currentUser={currentUser} paymentSettings={paymentSettings} onTopUp={handleTopUp} />;
      case UserRole.MERCHANT: return (
        <MerchantView 
          orders={orders.filter(o => o.shopId === currentUser.id)} 
          onUpdateStatus={handleUpdateOrderStatus} 
          merchantUser={currentUser} 
          onPlaceManualOrder={handlePlaceManualOrder}
          pricingSettings={paymentSettings.pricing}
          onTopUp={handleTopUp}
        />
      );
      case UserRole.DRIVER: return <DriverView orders={orders} currentDriverId={currentUser.id} paymentSettings={paymentSettings} onAcceptOrder={(id) => setOrders(prev => prev.map(o => o.id === id ? { ...o, driverId: currentUser.id, status: o.type === ServiceType.RIDE ? OrderStatus.IN_TRANSIT : OrderStatus.OUT_FOR_DELIVERY } : o))} onUpdateStatus={handleUpdateOrderStatus} />;
      case UserRole.ADMIN:
      case UserRole.SUPER_ADMIN: return <AdminView orders={orders} users={users} currentUser={currentUser} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} paymentSettings={paymentSettings} onUpdatePaymentSettings={updatePaymentSettings} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-indigo-50/20 pb-24 md:pb-0 md:pt-20">
      <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md shadow-sm border-b border-indigo-100 z-50 px-4 py-2">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 ${[UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(currentUser.role) ? 'bg-indigo-900' : 'bg-indigo-600'} rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200 transition-colors`}>
              D
            </div>
            <span className="text-2xl font-black text-indigo-900 tracking-tight hidden sm:inline">Duarte Delivery</span>
            {[UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(currentUser.role) && <span className={`text-[10px] ${currentUser.role === UserRole.SUPER_ADMIN ? 'bg-amber-500' : 'bg-indigo-900'} text-white px-2 py-1 rounded-lg font-black uppercase ml-2 tracking-widest`}>{currentUser.role === UserRole.SUPER_ADMIN ? 'Master' : 'Admin'}</span>}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-black text-indigo-950">{currentUser.name}</p>
              <div className="flex items-center gap-2 justify-end">
                <p className={`text-[10px] ${[UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(currentUser.role) ? 'text-indigo-400' : 'text-indigo-600'} font-bold uppercase tracking-wider`}>{currentUser.role}</p>
                <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md font-bold">R$ {currentUser.walletBalance.toFixed(2)}</span>
              </div>
            </div>
            <div className={`w-10 h-10 ${currentUser.role === UserRole.SUPER_ADMIN ? 'bg-amber-50' : 'bg-indigo-50'} rounded-full flex items-center justify-center font-bold ${currentUser.role === UserRole.SUPER_ADMIN ? 'text-amber-500' : 'text-indigo-300'} overflow-hidden border-2 border-white shadow-sm`}>
              {currentUser.avatar ? <img src={currentUser.avatar} alt="" /> : currentUser.name[0]}
            </div>
            <button onClick={handleLogout} className="bg-indigo-50 text-indigo-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all" title="Sair">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </div>
      </nav>
      {currentUser.role === UserRole.USER && (
        <div className="fixed bottom-24 right-6 md:bottom-8 md:right-8 flex flex-col gap-4 z-40">
          <button onClick={() => setIsVoiceOpen(true)} className="w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group relative">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
          </button>
          <button onClick={() => setIsChatOpen(!isChatOpen)} className="w-14 h-14 bg-indigo-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group relative">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
          </button>
        </div>
      )}
      <ChatSupport currentRole={currentUser.role} messages={messages} onSendMessage={handleSendMessage} isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <VoiceAssistant isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} />
      <main className="max-w-6xl mx-auto p-4 md:pt-10">{renderContent()}</main>
    </div>
  );
};

export default App;

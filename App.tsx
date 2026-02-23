
import React, { useState, useEffect, useMemo } from 'react';
import { UserRole, Order, OrderStatus, Shop, ServiceType, Message, Location, PaymentMethod, User, UserStatus, ApiSettings, WithdrawalRequest, TopUpRecord, ActivationCode } from './types';
import { MOCK_ORDERS, MOCK_SHOPS } from './constants';
import UserView from './views/UserView';
import MerchantView from './views/MerchantView';
import DriverView from './views/DriverView';
import AdminView from './views/AdminView';
import LoginView from './views/LoginView';
import AdminLoginView from './views/AdminLoginView';
import SetupWizardView from './views/SetupWizardView';
import UserProfileView from './views/UserProfileView';
import VoiceAssistant from './components/VoiceAssistant';
import ChatSupport from './components/ChatSupport';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('duarte_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('duarte_users');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'u1', name: 'Carlos Silva', email: 'carlos@email.com', password: 'user123', role: UserRole.USER, status: UserStatus.ACTIVE, createdAt: '2023-01-01T10:00:00Z', walletBalance: 150.00, phone: '(11) 99999-8888' },
      { id: 'master', name: 'Master Duarte', email: 'master@duarte.com', password: 'master123', role: UserRole.SUPER_ADMIN, status: UserStatus.ACTIVE, createdAt: new Date().toISOString(), walletBalance: 0, phone: '(11) 90000-0000' }
    ] as User[];
  });

  const [paymentSettings, setPaymentSettings] = useState<ApiSettings>(() => {
    const saved = localStorage.getItem('duarte_payment_settings');
    if (saved) return JSON.parse(saved);
    return {
      paymentGateway: 'MercadoPago',
      apiKey: 'fb5547554cfae52bf9750e828793d0da9bd3f08b34fe173e2ab45eae06531404', 
      webhookUrl: 'https://duarte-delivery-418028618744.us-west1.run.app/', 
      webhookSecret: '',
      commissionRate: 15.0,
      earlyWithdrawalFee: 5.0,
      defaultWithdrawalDay: 'Segunda-feira',
      isSandbox: true,
      activeMethods: [PaymentMethod.PIX, PaymentMethod.CREDIT_CARD],
      prepaidEnabled: false,
      pricing: {
        baseFee: 6.50,
        perKmRate: 1.80,
        minFare: 12.00,
        regions: [],
        topUpProducts: [
          { id: '1', name: 'Bronze Cash', amount: 50.00, description: 'Pacote Inicial', purchaseLink: 'https://pay.hotmart.com/ABC' }
        ]
      },
      activationCodes: [
        { id: 'c1', code: 'DUARTEFREE', value: 20.00, isUsed: false, multiUse: true, usedByEmails: [], createdAt: new Date().toISOString() }
      ]
    };
  });

  const [isViewingProfile, setIsViewingProfile] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [shops, setShops] = useState<Shop[]>(MOCK_SHOPS);
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('duarte_orders');
    return saved ? JSON.parse(saved) : MOCK_ORDERS;
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState(false);
  const [isChatSupportOpen, setIsChatSupportOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('duarte_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('duarte_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('duarte_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('duarte_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('duarte_payment_settings', JSON.stringify(paymentSettings));
  }, [paymentSettings]);

  const handleUpdateUser = (userId: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? ({ ...prev, ...updates }) : null);
    }
  };

  const handleRedeemCode = async (code: string) => {
    if (!currentUser) return false;
    
    const codeData = paymentSettings.activationCodes.find(c => c.code === code);
    if (!codeData) return false;

    // Lógica para multi-uso
    if (codeData.multiUse) {
      const alreadyUsed = codeData.usedByEmails?.includes(currentUser.email);
      if (alreadyUsed) return false;

      // Adiciona email do usuário à lista de quem já usou
      const newCodes = paymentSettings.activationCodes.map(c => 
        c.id === codeData.id ? { ...c, usedByEmails: [...(c.usedByEmails || []), currentUser.email] } : c
      );
      setPaymentSettings({ ...paymentSettings, activationCodes: newCodes });
      handleUpdateUser(currentUser.id, { walletBalance: currentUser.walletBalance + codeData.value });
      return true;
    } 
    
    // Lógica padrão uso único
    if (!codeData.isUsed) {
      const newCodes = paymentSettings.activationCodes.map(c => 
        c.id === codeData.id ? { ...c, isUsed: true, usedBy: currentUser.id } : c
      );
      setPaymentSettings({ ...paymentSettings, activationCodes: newCodes });
      handleUpdateUser(currentUser.id, { walletBalance: currentUser.walletBalance + codeData.value });
      return true;
    }

    return false;
  };

  const handleTopUp = (amount: number) => {
    if (!currentUser) return;
    handleUpdateUser(currentUser.id, { walletBalance: currentUser.walletBalance + amount });
  };

  const handlePlaceOrder = (data: any, type: ServiceType, payment: PaymentMethod) => {
    if (!currentUser) return;
    const newOrder: Order = {
      id: `ORD-${Date.now()}`,
      type,
      userId: currentUser.id,
      userName: currentUser.name,
      total: data.total,
      distance: data.distance,
      status: OrderStatus.PENDING,
      createdAt: new Date().toISOString(),
      paymentMethod: payment,
      paymentStatus: 'PAID',
      location: { lat: -23.55, lng: -46.63 },
      shopId: data.shop?.id,
      shopName: data.shop?.name,
      parcelDetails: data.parcelDetails,
      rideDetails: data.rideDetails
    };
    setOrders(prev => [newOrder, ...prev]);
    handleUpdateUser(currentUser.id, { walletBalance: currentUser.walletBalance - data.total });
  };

  const handleAcceptOrder = (orderId: string) => {
    if (!currentUser) return;
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, driverId: currentUser.id, status: OrderStatus.READY } : o));
  };

  const handleUpdateStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  const handleDeleteOrder = (orderId: string) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
  };

  const handleProcessWithdrawal = (requestId: string, status: 'COMPLETED' | 'REJECTED') => {
    setWithdrawalRequests(prev => prev.map(r => r.id === requestId ? { ...r, status } : r));
  };

  const handleSendMessage = async (text: string) => {
    if (!currentUser) return;
    const userMsg: Message = { id: Date.now().toString(), text, senderRole: currentUser.role, senderName: currentUser.name, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    const aiResponse = await geminiService.getChatSupportResponse(text, "Suporte Duarte Delivery");
    const botMsg: Message = { id: (Date.now() + 1).toString(), text: aiResponse, senderRole: UserRole.ADMIN, senderName: 'Suporte Duarte', timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, botMsg]);
  };

  const superAdminExists = useMemo(() => users.some(u => u.role === UserRole.SUPER_ADMIN), [users]);

  if (!superAdminExists && !currentUser) {
    return <SetupWizardView onComplete={(u) => { setUsers(prev => [...prev, u]); setCurrentUser(u); }} />;
  }
  
  if (!currentUser) {
    if (showAdminLogin) {
      return <AdminLoginView onLogin={setCurrentUser} onBack={() => setShowAdminLogin(false)} availableUsers={users} onResetPassword={(e, p) => handleUpdateUser(users.find(u => u.email === e)?.id || '', { password: p })} />;
    }
    return <LoginView onLogin={setCurrentUser} onAdminAccess={() => setShowAdminLogin(true)} availableUsers={users} onRegister={(u) => setUsers(p => [...p, u])} />;
  }

  const driverWithSettings = currentUser.role === UserRole.DRIVER ? {
    ...currentUser,
    withdrawalDay: currentUser.withdrawalDay || paymentSettings.defaultWithdrawalDay
  } : currentUser;

  return (
    <div className="min-h-screen bg-indigo-50/20">
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="bg-indigo-950 text-white px-4 md:px-6 py-1.5 flex justify-between items-center border-b border-white/5">
           <p className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.3em] text-indigo-400">Duarte Delivery System v5.2</p>
           <button onClick={() => { setCurrentUser(null); setIsViewingProfile(false); }} className="flex items-center gap-2 text-red-400 font-black text-[8px] md:text-[9px] uppercase hover:text-white transition-all">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
              Sair da Conta
           </button>
        </div>
        <nav className="bg-white/90 backdrop-blur-md shadow-sm px-4 md:px-6 py-3 flex justify-between items-center border-b border-indigo-50">
          <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => setIsViewingProfile(false)}>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-100">D</div>
            <span className="text-xl md:text-2xl font-black text-indigo-950 uppercase tracking-tighter">Duarte</span>
          </div>
          <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
             <button onClick={() => setIsViewingProfile(true)} className="text-right group truncate">
                <p className="text-[10px] md:text-xs font-black text-indigo-950 group-hover:text-indigo-600 transition-colors truncate max-w-[100px] md:max-w-none">{currentUser.name}</p>
                <p className="text-[8px] md:text-[10px] text-indigo-400 font-bold uppercase tracking-widest truncate">{currentUser.role}</p>
             </button>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto p-6 pt-36 pb-32">
        {isViewingProfile ? (
          <UserProfileView user={currentUser} onUpdate={handleUpdateUser} onBack={() => setIsViewingProfile(false)} />
        ) : (
          <>
            {currentUser.role === UserRole.USER && <UserView onPlaceOrder={handlePlaceOrder} allOrders={orders} currentUser={currentUser} paymentSettings={paymentSettings} onTopUp={handleTopUp} shops={shops} users={users} onRateOrder={() => {}} onRedeemCode={handleRedeemCode} />}
            {currentUser.role === UserRole.MERCHANT && <MerchantView orders={orders.filter(o => o.shopId === currentUser.id)} onUpdateStatus={handleUpdateStatus} merchantUser={currentUser} onPlaceManualOrder={(data) => handlePlaceOrder(data, ServiceType.PARCEL, PaymentMethod.WALLET)} pricingSettings={paymentSettings.pricing} onTopUp={handleTopUp} currentShop={shops.find(s => s.id === currentUser.id) || shops[0]} onUpdateShop={(id, upd) => setShops(prev => prev.map(s => s.id === id ? { ...s, ...upd } : s))} paymentSettings={paymentSettings} onRedeemCode={handleRedeemCode} />}
            {currentUser.role === UserRole.DRIVER && (
              <DriverView 
                orders={orders} 
                currentDriverId={currentUser.id} 
                paymentSettings={paymentSettings} 
                onAcceptOrder={handleAcceptOrder} 
                onUpdateStatus={handleUpdateStatus} 
                driverUser={driverWithSettings} 
                onUpdateUser={handleUpdateUser} 
                onRequestWithdrawal={(amount, early) => {
                  const feeVal = early ? amount * (paymentSettings.earlyWithdrawalFee / 100) : 0;
                  setWithdrawalRequests(prev => [...prev, {
                    id: `W-${Date.now()}`, userId: currentUser.id, userName: currentUser.name, amount, fee: feeVal, netAmount: amount - feeVal, pixKey: currentUser.pixKey || '', status: 'PENDING', requestedAt: new Date().toISOString(), isEarly: early
                  }]);
                  handleUpdateUser(currentUser.id, { walletBalance: currentUser.walletBalance - amount });
                }} 
              />
            )}
            {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUPER_ADMIN) && <AdminView orders={orders} users={users} currentUser={currentUser} onAddUser={(u) => setUsers(p => [...p, u])} onUpdateUser={handleUpdateUser} onDeleteUser={(id) => setUsers(p => p.filter(u => u.id !== id))} onDeleteOrder={handleDeleteOrder} paymentSettings={paymentSettings} onUpdatePaymentSettings={setPaymentSettings} withdrawalRequests={withdrawalRequests} onProcessWithdrawal={handleProcessWithdrawal} />}
          </>
        )}
      </main>

      <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-[100]">
         <button onClick={() => setIsVoiceAssistantOpen(true)} className="w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110"><i className="fas fa-microphone-lines text-xl"></i></button>
         <button onClick={() => setIsChatSupportOpen(true)} className="w-14 h-14 bg-white text-indigo-600 border border-indigo-100 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110"><i className="fas fa-comment-dots text-xl"></i></button>
      </div>

      <VoiceAssistant isOpen={isVoiceAssistantOpen} onClose={() => setIsVoiceAssistantOpen(false)} />
      <ChatSupport isOpen={isChatSupportOpen} onClose={() => setIsChatSupportOpen(false)} messages={messages} onSendMessage={handleSendMessage} currentRole={currentUser.role} />
    </div>
  );
};

export default App;

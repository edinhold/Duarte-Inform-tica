
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Order, OrderStatus, ServiceType, Location, PaymentMethod, ApiSettings, UserRole, User } from '../types';
import { TruckIcon, MapPinIcon } from '../components/Icons';
import MapView from '../components/MapView';

interface DriverViewProps {
  orders: Order[];
  currentDriverId: string;
  paymentSettings: ApiSettings;
  onAcceptOrder: (orderId: string) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  driverUser: User;
  onUpdateUser: (userId: string, updates: any) => void;
  onRequestWithdrawal: (amount: number, isEarly: boolean) => void;
}

const DriverView: React.FC<DriverViewProps> = ({ 
  orders, currentDriverId, paymentSettings, onAcceptOrder, onUpdateStatus, 
  driverUser, onUpdateUser, onRequestWithdrawal 
}) => {
  const [view, setView] = useState<'MAP' | 'WALLET' | 'OFFERS'>('OFFERS');
  const [driverLocation, setDriverLocation] = useState<Location>({ lat: -23.5505, lng: -46.6333 });
  const [isOnline, setIsOnline] = useState(false);
  const [pixKeyInput, setPixKeyInput] = useState(driverUser.pixKey || '');
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);
  const [newOrderAlert, setNewOrderAlert] = useState<Order | null>(null);
  const [isEarlyWithdrawal, setIsEarlyWithdrawal] = useState(false);
  const [isSavingPix, setIsSavingPix] = useState(false);
  
  const lastOrderCount = useRef(0);

  // Som de notificação
  const playNotificationSound = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(e => console.log("Áudio bloqueado pelo navegador até interação."));
    } catch (e) {
      console.error("Erro ao tocar som:", e);
    }
  };

  // Monitorar localização real
  useEffect(() => {
    let watchId: number;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          setDriverLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.error("Erro GPS:", error),
        { enableHighAccuracy: true }
      );
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const getEarningValue = (total: number) => total * (1 - (paymentSettings.commissionRate / 100));

  const stats = useMemo(() => {
    const myCompleted = orders.filter(o => o.driverId === currentDriverId && o.status === OrderStatus.COMPLETED);
    const todayOrders = myCompleted.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString());
    const dailyEarnings = todayOrders.reduce((sum, order) => sum + getEarningValue(order.total), 0);
    const totalEarnings = myCompleted.reduce((sum, order) => sum + getEarningValue(order.total), 0);

    return {
      todayCount: todayOrders.length,
      todayEarnings: dailyEarnings,
      totalCount: myCompleted.length,
      totalEarnings: totalEarnings
    };
  }, [orders, currentDriverId, paymentSettings.commissionRate]);

  const availableOrders = useMemo(() => {
    if (!isOnline) return [];
    return orders.filter(o => !o.driverId && (o.status === OrderStatus.PENDING || o.status === OrderStatus.READY));
  }, [orders, isOnline]);

  const activeOrder = useMemo(() => {
    return orders.find(o => o.driverId === currentDriverId && o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.CANCELLED);
  }, [orders, currentDriverId]);

  useEffect(() => {
    if (isOnline && availableOrders.length > lastOrderCount.current) {
      const latest = availableOrders[0];
      setNewOrderAlert(latest);
      playNotificationSound();
      const timer = setTimeout(() => setNewOrderAlert(null), 8000);
      return () => clearTimeout(timer);
    }
    lastOrderCount.current = availableOrders.length;
  }, [availableOrders, isOnline]);

  const mapMarkers = useMemo(() => {
    const markers: any[] = [{ position: driverLocation, label: 'Você (Duarte)', type: 'DRIVER' }];
    
    if (activeOrder) {
      markers.push({ 
        position: activeOrder.location, 
        label: activeOrder.type === ServiceType.PARCEL ? 'Ponto de Coleta' : 'Embarque Passageiro', 
        type: 'SHOP' 
      });

      if (activeOrder.destinationLocation) {
        markers.push({ 
          position: activeOrder.destinationLocation, 
          label: 'Ponto de Entrega', 
          type: 'USER' 
        });
      }
    }
    return markers;
  }, [driverLocation, activeOrder]);

  const handleFinishOrder = (orderId: string) => {
    onUpdateStatus(orderId, OrderStatus.COMPLETED);
    setView('OFFERS');
  };

  const handleToggleOnline = () => {
    setIsOnline(!isOnline);
    if (!isOnline) setView('OFFERS');
  };

  const handleSavePixKey = () => {
    if (!pixKeyInput.trim()) return alert("Insira uma chave PIX válida.");
    setIsSavingPix(true);
    setTimeout(() => {
      onUpdateUser(driverUser.id, { pixKey: pixKeyInput });
      setIsSavingPix(false);
      alert("Chave PIX atualizada com sucesso!");
    }, 800);
  };

  const handleWithdrawalRequest = () => {
    if (withdrawAmount <= 0) return alert("Insira um valor válido para saque.");
    if (withdrawAmount > driverUser.walletBalance) return alert("Saldo insuficiente.");
    if (!driverUser.pixKey) return alert("Você precisa cadastrar sua chave PIX antes de solicitar um saque.");
    
    onRequestWithdrawal(withdrawAmount, isEarlyWithdrawal);
    setWithdrawAmount(0);
    alert("Solicitação de saque enviada para análise do administrador.");
  };

  const withdrawalFeeAmount = isEarlyWithdrawal ? withdrawAmount * (paymentSettings.earlyWithdrawalFee / 100) : 0;
  const netWithdrawalAmount = withdrawAmount - withdrawalFeeAmount;

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-500 relative">
      {newOrderAlert && (
        <div className="fixed top-24 left-4 right-4 z-[100] animate-in slide-in-from-top duration-500">
           <div className="bg-indigo-600 text-white p-6 rounded-[2.5rem] shadow-2xl flex items-center justify-between border-4 border-white/20 backdrop-blur-lg">
              <div className="flex items-center gap-4">
                 <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl animate-bounce">📦</div>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">Oferta de Corrida</p>
                    <p className="font-black text-lg">Ganho R$ {getEarningValue(newOrderAlert.total).toFixed(2)}</p>
                    <p className="text-[9px] font-bold opacity-70 truncate max-w-[150px]">{newOrderAlert.parcelDetails?.destination || 'Destino Local'}</p>
                 </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setView('OFFERS'); setNewOrderAlert(null); }} className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg hover:bg-indigo-50 transition-all">Aceitar</button>
                <button onClick={() => setNewOrderAlert(null)} className="bg-white/10 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase border border-white/20 hover:bg-white/20 transition-all">Ignorar</button>
              </div>
           </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-[2.5rem] shadow-lg border border-indigo-100 flex items-center justify-between sticky top-4 z-[60] backdrop-blur-md bg-white/90">
         <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`}></div>
            <div>
               <p className="text-[10px] font-black text-indigo-950 uppercase tracking-[0.2em] leading-none">Status: {isOnline ? 'Online' : 'Offline'}</p>
               <p className="text-[8px] text-indigo-400 font-bold uppercase mt-1">Sincronizando via GPS Ativo</p>
            </div>
         </div>
         <button onClick={handleToggleOnline} className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg transition-all ${isOnline ? 'bg-red-500 text-white' : 'bg-indigo-600 text-white'}`}>
           {isOnline ? 'Sair de Serviço' : 'Ficar Disponível'}
         </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
         <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-indigo-50 shadow-sm text-center">
            <p className="text-[7px] md:text-[8px] font-black text-indigo-300 uppercase mb-1">Hoje</p>
            <p className="text-xl md:text-2xl font-black text-indigo-950">R$ {stats.todayEarnings.toFixed(2)}</p>
         </div>
         <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-indigo-50 shadow-sm text-center">
            <p className="text-[7px] md:text-[8px] font-black text-indigo-300 uppercase mb-1">Acumulado</p>
            <p className="text-xl md:text-2xl font-black text-indigo-950">R$ {stats.totalEarnings.toFixed(2)}</p>
         </div>
         <div className="bg-indigo-950 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-indigo-50 shadow-sm text-center text-white col-span-2 md:col-span-1">
            <p className="text-[7px] md:text-[8px] font-black text-indigo-400 uppercase mb-1">Saldo Duarte Cash</p>
            <p className="text-xl md:text-2xl font-black text-green-400">R$ {driverUser.walletBalance.toFixed(2)}</p>
         </div>
      </div>

      <nav className="flex gap-2 overflow-x-auto no-scrollbar">
         {['OFFERS', 'MAP', 'WALLET'].map(m => (
            <button key={m} onClick={() => setView(m as any)} className={`flex-1 min-w-[80px] py-3 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all ${view === m ? 'bg-indigo-950 text-white shadow-xl' : 'bg-white text-indigo-400 border border-indigo-50'}`}>
               {m === 'OFFERS' ? 'Radar' : m === 'MAP' ? 'Mapa' : 'Carteira'}
            </button>
         ))}
      </nav>

      {view === 'OFFERS' && (
        <div className="space-y-4 animate-in slide-in-from-bottom duration-500">
           {isOnline ? (
             <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {availableOrders.map(order => (
                     <div key={order.id} className="bg-white p-8 rounded-[3rem] shadow-sm border border-indigo-50 group hover:border-indigo-600 transition-all">
                       <div className="flex justify-between items-start mb-6">
                          <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase">{order.type}</span>
                          <div className="text-right">
                            <p className="text-2xl font-black text-green-600">R$ {getEarningValue(order.total).toFixed(2)}</p>
                            <p className="text-[8px] font-black text-indigo-300 uppercase">Líquido (Bruto: R$ {order.total.toFixed(2)})</p>
                          </div>
                       </div>
                       <div className="space-y-3 mb-8">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center text-sm">🏪</div>
                             <p className="text-sm font-black text-indigo-950 uppercase">{order.shopName || 'Coleta'}</p>
                          </div>
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center text-sm">📍</div>
                             <p className="text-xs text-indigo-400 font-bold truncate">{order.parcelDetails?.destination || order.rideDetails?.destination}</p>
                          </div>
                       </div>
                       <button onClick={() => { onAcceptOrder(order.id); setView('MAP'); }} className="w-full bg-indigo-950 text-white py-5 rounded-[1.5rem] font-black uppercase text-xs shadow-xl">Aceitar Chamado</button>
                     </div>
                   ))}
                </div>
             </div>
           ) : (
             <div className="bg-indigo-950 text-white p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] text-center shadow-2xl">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">💤</div>
                <h2 className="text-xl font-black mb-2 uppercase">Radar Desligado</h2>
                <button onClick={handleToggleOnline} className="bg-white text-indigo-950 px-10 py-4 rounded-2xl font-black uppercase text-[10px]">Ativar Agora</button>
             </div>
           )}
        </div>
      )}

      {view === 'MAP' && (
        <div className="h-[550px] bg-white p-3 rounded-[3.5rem] shadow-2xl border border-indigo-50 relative overflow-hidden">
           <MapView markers={mapMarkers} center={driverLocation} showRouteLine={true} />
           {activeOrder && (
             <div className="absolute bottom-6 left-6 right-6 z-10 bg-indigo-950 text-white p-8 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-4">
                <div className="flex justify-between items-center">
                   <div className="flex-1">
                      <p className="text-[8px] font-black text-indigo-400 uppercase mb-1">Rota Ativa</p>
                      <h4 className="font-bold text-xs truncate">Para: {activeOrder.parcelDetails?.destination || activeOrder.rideDetails?.destination}</h4>
                   </div>
                   <div className="text-right">
                      <p className="text-xl font-black text-green-400">R$ {getEarningValue(activeOrder.total).toFixed(2)}</p>
                      <p className="text-[8px] font-black text-indigo-400 uppercase">Líquido (Bruto: R$ {activeOrder.total.toFixed(2)})</p>
                   </div>
                </div>
                <button onClick={() => handleFinishOrder(activeOrder.id)} className="w-full bg-green-600 py-4 rounded-2xl font-black text-[10px] uppercase">Finalizar Corrida</button>
             </div>
           )}
        </div>
      )}

      {view === 'WALLET' && (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
           {/* Cadastro de Chave PIX */}
           <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-indigo-50 space-y-6">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl">🔑</div>
                 <div>
                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest leading-none mb-1">Dados Bancários</p>
                    <h4 className="text-sm font-black text-indigo-950 uppercase">Chave PIX para Recebimento</h4>
                 </div>
              </div>
              <div className="flex flex-col md:flex-row gap-3">
                 <input 
                    className="flex-1 bg-indigo-50 border-0 rounded-2xl p-4 font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-600 transition-all" 
                    placeholder="CPF, E-mail, Celular ou Aleatória" 
                    value={pixKeyInput}
                    onChange={e => setPixKeyInput(e.target.value)}
                 />
                 <button 
                    onClick={handleSavePixKey}
                    disabled={isSavingPix}
                    className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] shadow-lg hover:bg-black transition-all disabled:opacity-50"
                 >
                    {isSavingPix ? 'Salvando...' : 'Salvar Chave'}
                 </button>
              </div>
              {!driverUser.pixKey && (
                 <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3">
                    <span className="text-amber-600 animate-pulse">⚠️</span>
                    <p className="text-[9px] font-bold text-amber-700 uppercase leading-relaxed">Você precisa cadastrar uma chave para que o administrador possa realizar seus pagamentos.</p>
                 </div>
              )}
           </div>

           <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-indigo-50 space-y-4">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center text-xl">📅</div>
                 <div>
                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Agenda de Saques</p>
                    <h4 className="text-sm font-black text-indigo-950 uppercase">Seu dia confirmado:</h4>
                    <p className="text-indigo-600 font-black text-lg">{driverUser.withdrawalDay || 'Segunda-feira'}</p>
                 </div>
              </div>
           </div>

           <div className="bg-indigo-950 text-white p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl space-y-6 relative overflow-hidden">
              <div className="text-center">
                 <p className="text-[10px] font-black text-indigo-400 uppercase mb-4 tracking-widest">Resgate PIX</p>
                 <input type="number" className="bg-transparent border-0 font-black text-5xl w-full text-center focus:ring-0 text-white mb-2" value={withdrawAmount || ''} onChange={e => setWithdrawAmount(parseFloat(e.target.value))} placeholder="0,00" />
                 <p className="text-[9px] font-black text-indigo-500 uppercase">Disponível: R$ {driverUser.walletBalance.toFixed(2)}</p>
              </div>

              <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 space-y-4">
                 <div className="flex justify-between items-center">
                    <div>
                       <h5 className="text-xs font-black uppercase">Solicitar Antecipação</h5>
                       <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest">Receba Hoje (Taxa {paymentSettings.earlyWithdrawalFee}%)</p>
                    </div>
                    <button onClick={() => setIsEarlyWithdrawal(!isEarlyWithdrawal)} className={`w-12 h-6 rounded-full transition-all relative ${isEarlyWithdrawal ? 'bg-green-500' : 'bg-indigo-800'}`}>
                       <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isEarlyWithdrawal ? 'right-1' : 'left-1'}`}></div>
                    </button>
                 </div>
              </div>

              {withdrawAmount > 0 && isEarlyWithdrawal && (
                 <div className="text-center animate-in fade-in duration-300">
                    <p className="text-[10px] font-black text-indigo-400 uppercase">Valor Líquido Estimado:</p>
                    <p className="text-xl font-black text-green-400">R$ {netWithdrawalAmount.toFixed(2)}</p>
                 </div>
              )}

              <button 
                onClick={handleWithdrawalRequest} 
                className="w-full bg-green-600 text-white py-5 rounded-3xl font-black uppercase text-[10px] shadow-lg hover:bg-green-500 transition-all"
              >
                {isEarlyWithdrawal ? 'Antecipar Saque Agora' : 'Solicitar Saque Agendado'}
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default DriverView;


import React, { useEffect, useState, useMemo } from 'react';
import { Order, OrderStatus, User, ServiceType, PaymentMethod } from '../types';
import { geminiService } from '../services/geminiService';

interface MerchantViewProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  merchantUser: User;
  onPlaceManualOrder: (data: any) => void;
  pricingSettings: any;
  onTopUp: (amount: number) => void;
}

const MerchantView: React.FC<MerchantViewProps> = ({ orders, onUpdateStatus, merchantUser, onPlaceManualOrder, pricingSettings, onTopUp }) => {
  const [aiTip, setAiTip] = useState<string>('Carregando insight estratégico...');
  const [showManualModal, setShowManualModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  
  // Estado para o formulário de entrega direta
  const [manualForm, setManualForm] = useState({
    recipientName: '',
    recipientPhone: '',
    deliveryAddress: '',
    pickupAddress: merchantUser.address || '',
    description: ''
  });

  const ratedOrders = orders.filter(o => o.merchantRating !== undefined);
  const avgRating = ratedOrders.length > 0 
    ? (ratedOrders.reduce((acc, o) => acc + (o.merchantRating || 0), 0) / ratedOrders.length).toFixed(1)
    : 'N/A';

  const orderStats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekStart = now.getTime() - (7 * 24 * 60 * 60 * 1000);
    const monthStart = now.getTime() - (30 * 24 * 60 * 60 * 1000);

    const filterByTime = (time: number) => orders.filter(o => new Date(o.createdAt).getTime() >= time).length;

    return {
      day: filterByTime(todayStart),
      week: filterByTime(weekStart),
      month: filterByTime(monthStart)
    };
  }, [orders]);

  useEffect(() => {
    const fetchTip = async () => {
      const tip = await geminiService.getMerchantStrategy(orders.length, ratedOrders.map(o => o.merchantRating || 5));
      setAiTip(tip || '');
    };
    fetchTip();
  }, [orders.length]);

  const activeOrders = orders.filter(o => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED);

  const calculateManualEstimate = () => {
    const simulatedDist = 4.5; // Simulação para o MVP
    let price = pricingSettings.baseFee + (simulatedDist * pricingSettings.perKmRate);
    return Math.max(price, pricingSettings.minFare);
  };

  const handleSendManualRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const total = calculateManualEstimate();
    
    if (merchantUser.walletBalance < total) {
      alert("Saldo insuficiente na Carteira Logística! Recarregue para solicitar coletas.");
      setShowWalletModal(true);
      return;
    }

    onPlaceManualOrder({
      ...manualForm,
      total
    });
    setShowManualModal(false);
    setManualForm({
      recipientName: '',
      recipientPhone: '',
      deliveryAddress: '',
      pickupAddress: merchantUser.address || '',
      description: ''
    });
    alert("Entregador solicitado! O valor foi debitado do seu saldo pré-pago.");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Modal de Recarga da Carteira */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-indigo-950/80 backdrop-blur-md z-[250] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl animate-in zoom-in duration-300">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-black text-indigo-950">Recarregar Saldo Logístico</h3>
                 <button onClick={() => setShowWalletModal(false)} className="text-indigo-200 hover:text-indigo-600 transition-colors">✕</button>
              </div>
              <p className="text-xs text-indigo-400 mb-6 font-medium">Adicione créditos para solicitar coletas de pedidos externos via Entrega Direta.</p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                 {[50, 100, 200, 500].map(val => (
                   <button 
                    key={val}
                    onClick={() => { onTopUp(val); setShowWalletModal(false); }}
                    className="bg-indigo-50 hover:bg-indigo-600 hover:text-white p-6 rounded-3xl font-black text-indigo-900 transition-all border border-indigo-100"
                   >
                     R$ {val},00
                   </button>
                 ))}
              </div>
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                 <p className="text-[10px] text-amber-700 font-black uppercase tracking-widest mb-1">Duarte Pay</p>
                 <p className="text-[10px] text-amber-600 font-medium italic">A recarga via Pix é processada instantaneamente.</p>
              </div>
           </div>
        </div>
      )}

      {/* Modal de Entrega Direta */}
      {showManualModal && (
        <div className="fixed inset-0 bg-indigo-950/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-8 shadow-2xl border border-indigo-100 animate-in zoom-in duration-300">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-indigo-950">Nova Entrega Direta</h3>
                <button onClick={() => setShowManualModal(false)} className="text-indigo-200 hover:text-indigo-600 transition-colors text-2xl">✕</button>
             </div>
             
             <form onSubmit={handleSendManualRequest} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-indigo-300 uppercase block mb-1">Nome do Destinatário</label>
                    <input required className="w-full bg-indigo-50/50 border-0 rounded-xl p-3 text-indigo-900 font-medium" value={manualForm.recipientName} onChange={e => setManualForm({...manualForm, recipientName: e.target.value})} placeholder="Ex: Maria Oliveira" />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-[10px] font-black text-indigo-300 uppercase block mb-1">Telefone / WhatsApp</label>
                    <input required className="w-full bg-indigo-50/50 border-0 rounded-xl p-3 text-indigo-900 font-medium" value={manualForm.recipientPhone} onChange={e => setManualForm({...manualForm, recipientPhone: e.target.value})} placeholder="(11) 99999-9999" />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-[10px] font-black text-indigo-300 uppercase block mb-1">O que é a entrega?</label>
                    <input required className="w-full bg-indigo-50/50 border-0 rounded-xl p-3 text-indigo-900 font-medium" value={manualForm.description} onChange={e => setManualForm({...manualForm, description: e.target.value})} placeholder="Ex: Pacote de Roupas" />
                  </div>
                </div>

                <div>
                   <label className="text-[10px] font-black text-indigo-300 uppercase block mb-1">Endereço de Coleta (Sua Loja)</label>
                   <input required className="w-full bg-indigo-50/20 border-0 rounded-xl p-3 text-indigo-400 font-medium cursor-not-allowed" readOnly value={manualForm.pickupAddress} />
                </div>

                <div>
                   <label className="text-[10px] font-black text-indigo-300 uppercase block mb-1">Endereço de Entrega</label>
                   <input required className="w-full bg-indigo-50/50 border-0 rounded-xl p-3 text-indigo-900 font-medium" value={manualForm.deliveryAddress} onChange={e => setManualForm({...manualForm, deliveryAddress: e.target.value})} placeholder="Rua das Acácias, 450 - Centro" />
                </div>

                <div className="bg-indigo-900 text-white p-6 rounded-3xl flex justify-between items-center shadow-xl">
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Custo Pré-Pago</p>
                      <p className="text-2xl font-black">R$ {calculateManualEstimate().toFixed(2)}</p>
                   </div>
                   <button type="submit" className="bg-white text-indigo-900 px-6 py-3 rounded-2xl font-black uppercase text-xs shadow-lg hover:bg-indigo-50 transition-all">Solicitar Coleta</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Seção da Carteira Duarte (Pre-paid) para o Lojista */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-indigo-900 to-black p-8 rounded-[3rem] shadow-2xl text-white relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
           </div>
           <div className="relative z-10">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2">Carteira Duarte Lojista</p>
              <h2 className="text-4xl font-black mb-6">R$ {merchantUser.walletBalance.toFixed(2)}</h2>
              <div className="flex gap-4">
                 <button onClick={() => setShowWalletModal(true)} className="bg-white text-indigo-900 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all">Recarregar</button>
                 <button className="bg-white/10 text-white border border-white/20 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all">Relatórios</button>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-indigo-50 flex flex-col justify-center text-center">
            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Ganhos em Vendas</p>
            <h3 className="text-2xl font-black text-indigo-950">R$ {orders.filter(o => !o.id.startsWith('MAN')).reduce((acc, o) => acc + o.total, 0).toFixed(2)}</h3>
          </div>
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-indigo-50 flex flex-col justify-center text-center">
            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Gastos Logística</p>
            <h3 className="text-2xl font-black text-red-500">R$ {orders.filter(o => o.id.startsWith('MAN')).reduce((acc, o) => acc + o.total, 0).toFixed(2)}</h3>
          </div>
        </div>
      </div>

      <header className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-indigo-50">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-900 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg">
             {merchantUser.name[0]}
          </div>
          <div>
            <h1 className="text-2xl font-black text-indigo-950 tracking-tight">Cozinha: {merchantUser.name}</h1>
            <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest">Painel Operacional Lojista</p>
          </div>
        </div>
        <button 
          onClick={() => setShowManualModal(true)}
          className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-black transition-all flex items-center gap-2"
        >
          <span className="text-lg">📦</span> Nova Coleta Direta
        </button>
      </header>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-[2rem] border border-indigo-50 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Hoje</p>
            <h3 className="text-2xl font-black text-indigo-950">{orderStats.day} Chamados</h3>
          </div>
          <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center font-bold">↑</div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-indigo-50 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Esta Semana</p>
            <h3 className="text-2xl font-black text-indigo-950">{orderStats.week} Chamados</h3>
          </div>
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">📅</div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-indigo-50 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Este Mês</p>
            <h3 className="text-2xl font-black text-indigo-950">{orderStats.month} Chamados</h3>
          </div>
          <div className="w-10 h-10 bg-indigo-950 text-white rounded-xl flex items-center justify-center font-bold">📊</div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white p-6 rounded-[2rem] shadow-xl flex items-center gap-4 border border-indigo-700">
        <div className="bg-white/10 p-4 rounded-2xl text-2xl">⚡</div>
        <div>
          <h3 className="font-black text-xs uppercase tracking-[0.2em] text-indigo-300 mb-1">Duarte IA Insight</h3>
          <p className="text-lg font-medium italic opacity-90">"{aiTip}"</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
               Fluxo de Pedidos Ativos
               <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-lg">{activeOrders.length}</span>
            </h2>
          </div>

          {activeOrders.length === 0 ? (
            <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-indigo-100 text-center space-y-4">
              <div className="text-4xl opacity-20">🥡</div>
              <p className="text-indigo-200 font-bold uppercase tracking-widest text-xs">Cozinha em repouso. Aguardando novos pedidos.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {activeOrders.map(order => (
                <div key={order.id} className={`bg-white p-6 rounded-[2.5rem] shadow-sm border transition-all ${order.status === OrderStatus.READY ? 'border-indigo-600 ring-4 ring-indigo-50' : 'border-indigo-50'}`}>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="bg-indigo-950 text-white px-3 py-1 rounded-xl text-[10px] font-black">#{order.id}</span>
                        <span className="font-black text-indigo-950">
                          {order.id.startsWith('MAN') ? `Destinatário: ${order.userName}` : order.userName}
                        </span>
                        {order.id.startsWith('MAN') && (
                          <span className="bg-indigo-900 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase">Entrega Direta</span>
                        )}
                      </div>
                      <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-50">
                        {order.items ? (
                          <ul className="text-xs text-indigo-900 space-y-1 font-bold">
                            {order.items?.map((item, idx) => (
                              <li key={idx} className="flex justify-between">
                                <span>{item.quantity}x {item.name}</span>
                                <span className="opacity-40">R$ {(item.price * item.quantity).toFixed(2)}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-xs text-indigo-900 font-bold">
                             <p className="opacity-60">Endereço: {order.parcelDetails?.destination}</p>
                             <p className="opacity-60">Volume: {order.parcelDetails?.description}</p>
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-black text-indigo-600">
                        {order.id.startsWith('MAN') ? `Taxa Logística (Debitada): R$ ${order.total.toFixed(2)}` : `Valor do Pedido: R$ ${order.total.toFixed(2)}`}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 w-full md:w-auto">
                      {order.status === OrderStatus.PENDING && (
                        <button 
                          onClick={() => onUpdateStatus(order.id, OrderStatus.PREPARING)}
                          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95"
                        >
                          Aceitar Pedido
                        </button>
                      )}
                      
                      {order.status === OrderStatus.PREPARING && (
                        <button 
                          onClick={() => onUpdateStatus(order.id, OrderStatus.READY)}
                          className="bg-amber-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-600 shadow-xl shadow-amber-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                          <span className="animate-pulse">🔔</span> Chamar Entregador
                        </button>
                      )}

                      {order.status === OrderStatus.READY && (
                        <div className="bg-green-50 text-green-700 px-6 py-4 rounded-2xl border border-green-100 text-center animate-pulse">
                           <p className="text-[10px] font-black uppercase tracking-widest">Sinal Enviado!</p>
                           <p className="text-xs font-bold">Aguardando Coleta...</p>
                        </div>
                      )}

                      {(order.status === OrderStatus.OUT_FOR_DELIVERY || order.status === OrderStatus.IN_TRANSIT) && (
                        <div className="bg-indigo-50 text-indigo-400 px-6 py-4 rounded-2xl border border-indigo-100 text-center">
                           <p className="text-[10px] font-black uppercase tracking-widest">Em Trânsito</p>
                           <p className="text-xs font-bold">Motorista a Caminho</p>
                        </div>
                      )}

                      <span className="text-center text-[9px] text-indigo-200 uppercase tracking-widest font-black mt-2">
                        {order.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <h2 className="text-xs font-black text-indigo-400 uppercase tracking-widest px-2">Feedbacks Recentes</h2>
          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-indigo-50 space-y-6">
            {ratedOrders.slice(0, 3).map(o => (
              <div key={o.id} className="border-b border-indigo-50 pb-4 last:border-0 last:pb-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black text-indigo-200 uppercase tracking-tighter">Pedido #{o.id}</span>
                  <span className="text-amber-500 font-bold">{'★'.repeat(o.merchantRating || 0)}</span>
                </div>
                <p className="text-[10px] italic text-indigo-400">"{new Date(o.ratedAt || '').toLocaleDateString('pt-BR')}"</p>
              </div>
            ))}
            {ratedOrders.length === 0 && <p className="text-xs text-indigo-200 font-medium italic text-center">Nenhuma avaliação recebida.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantView;

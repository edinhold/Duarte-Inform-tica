
import React, { useEffect, useState, useMemo } from 'react';
import { Order, OrderStatus, User, ServiceType, Shop, MenuItem, ApiSettings, TopUpProduct, Location } from '../types';
import { TruckIcon, TrashIcon, StoreIcon, MapPinIcon } from '../components/Icons';
import { paymentService } from '../services/paymentService';
import MapView from '../components/MapView';

interface MerchantViewProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  merchantUser: User;
  onPlaceManualOrder: (data: any) => void;
  pricingSettings: any;
  onTopUp: (amount: number) => void;
  currentShop: Shop;
  onUpdateShop: (shopId: string, updates: Partial<Shop>) => void;
  paymentSettings: ApiSettings;
  onRedeemCode?: (code: string) => Promise<boolean>;
}

const MerchantView: React.FC<MerchantViewProps> = ({ 
  orders, onUpdateStatus, merchantUser, onPlaceManualOrder, 
  pricingSettings, onTopUp, currentShop, onUpdateShop, paymentSettings, onRedeemCode
}) => {
  const [tab, setTab] = useState<'OPERATIONS' | 'MENU' | 'CRM' | 'WALLET'>('OPERATIONS');
  
  const [showManualOrder, setShowManualOrder] = useState(false);
  const [manualData, setManualData] = useState({ 
    recipientName: '', 
    address: '', 
    phone: '', 
    description: '',
    senderName: currentShop.name,
    senderPhone: currentShop.phone || merchantUser.phone || ''
  });

  const [notification, setNotification] = useState<{msg: string} | null>(null);
  const [isProcessingTopUp, setIsProcessingTopUp] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);
  
  // Estados para Resgate de Código
  const [activationCodeInput, setActivationCodeInput] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  // Monitorar localização em tempo real do estabelecimento
  const [shopLocation, setShopLocation] = useState<Location>(currentShop.location);

  useEffect(() => {
    if (navigator.geolocation && showManualOrder) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setShopLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.error("Erro GPS Lojista:", error),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [showManualOrder]);

  const handleRedeem = async () => {
    if (!activationCodeInput.trim() || !onRedeemCode) return;
    setIsRedeeming(true);
    const success = await onRedeemCode(activationCodeInput.toUpperCase().trim());
    if (success) {
      setActivationCodeInput('');
      alert("Sucesso! O saldo foi creditado em sua conta Duarte.");
    } else {
      alert("Código inválido ou já resgatado.");
    }
    setIsRedeeming(false);
  };

  // Marcadores para o Mapa de Despacho Avulso
  const manualOrderMarkers = useMemo(() => {
    const markers: any[] = [
      { 
        position: shopLocation, 
        label: `LOJA: ${currentShop.name} | TEL: ${manualData.senderPhone}`, 
        type: 'SHOP' 
      }
    ];
    if (manualData.address.length > 5) {
      // Simulação de destino próximo para o mapa
      const destCoords = { lat: shopLocation.lat + 0.005, lng: shopLocation.lng + 0.005 };
      markers.push({ 
        position: destCoords, 
        label: `DESTINATÁRIO: ${manualData.recipientName || 'Cliente'} | TEL: ${manualData.phone}`, 
        type: 'USER' 
      });
    }
    return markers;
  }, [currentShop, shopLocation, manualData.address, manualData.recipientName, manualData.phone, manualData.senderPhone]);

  useEffect(() => {
    const lastDelivered = orders.find(o => 
      (o.status === OrderStatus.DELIVERED || o.status === OrderStatus.COMPLETED) &&
      o.shopId === currentShop.id
    );
    
    if (lastDelivered) {
      setNotification({
        msg: `ENTREGA CONCLUÍDA: O pedido para ${lastDelivered.parcelDetails?.recipientName || lastDelivered.userName} chegou ao destino!`
      });
      const timer = setTimeout(() => setNotification(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [orders, currentShop.id]);

  const handleSaveItem = () => {
    if (!editingItem?.name || editingItem.price === undefined) return alert("Preencha Nome e Preço!");
    const newItem = { 
      id: editingItem.id || `m-${Date.now()}`,
      name: editingItem.name,
      description: editingItem.description || '',
      price: Number(editingItem.price),
      image: editingItem.image || 'https://picsum.photos/seed/duarte/400/400'
    } as MenuItem;
    
    const newMenu = editingItem.id 
      ? currentShop.menu.map(i => i.id === editingItem.id ? newItem : i) 
      : [...currentShop.menu, newItem];
      
    onUpdateShop(currentShop.id, { menu: newMenu });
    setEditingItem(null);
  };

  const deleteItem = (itemId: string) => {
    if (window.confirm("Deseja remover este item do cardápio?")) {
      const newMenu = currentShop.menu.filter(i => i.id !== itemId);
      onUpdateShop(currentShop.id, { menu: newMenu });
    }
  };

  const handleConfirmManualOrder = () => {
    if (!manualData.recipientName || !manualData.address || !manualData.phone || !manualData.description) {
      return alert("Preencha todos os campos do destinatário e descreva o objeto!");
    }
    const distance = 2.0 + Math.random() * 5.0;
    const total = paymentSettings.pricing.baseFee + (distance * paymentSettings.pricing.perKmRate);
    const orderPayload = {
      total: Math.max(total, paymentSettings.pricing.minFare),
      distance: distance,
      parcelDetails: {
        senderName: manualData.senderName,
        senderPhone: manualData.senderPhone,
        recipientName: manualData.recipientName,
        recipientPhone: manualData.phone,
        destination: manualData.address,
        description: manualData.description
      },
      shop: currentShop
    };
    onPlaceManualOrder(orderPayload);
    setShowManualOrder(false);
    setManualData({ recipientName: '', address: '', phone: '', description: '', senderName: currentShop.name, senderPhone: currentShop.phone || merchantUser.phone || '' });
    setTab('OPERATIONS');
  };

  const handleBuyCredits = (product: TopUpProduct) => {
    if (product.purchaseLink) {
      window.open(product.purchaseLink, '_blank');
    } else {
      alert("Este pacote não possui um link de compra configurado no painel administrativo.");
    }
  };

  const merchantCRM = useMemo(() => {
    const stats = (start: number) => orders.filter(o => new Date(o.createdAt).getTime() >= start).length;
    return { day: stats(new Date().setHours(0,0,0,0)), week: stats(Date.now() - 604800000), month: stats(Date.now() - 2592000000) };
  }, [orders]);

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-500 relative">
      
      {/* Modal de Despacho Avulso com Mapa em Tempo Real */}
      {showManualOrder && (
        <div className="fixed inset-0 bg-indigo-950/95 backdrop-blur-xl z-[200] flex items-center justify-center p-4 md:p-10 overflow-y-auto">
           <div className="bg-white w-full max-w-6xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row h-full lg:h-[80vh]">
              {/* Painel Esquerdo: Mapa GPS em Tempo Real */}
              <div className="flex-1 bg-indigo-50 relative min-h-[300px]">
                 <MapView markers={manualOrderMarkers} center={shopLocation} showRouteLine={true} />
                 <div className="absolute top-6 left-6 z-10 space-y-3">
                    <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-indigo-100 max-w-xs">
                       <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Loja (GPS em Tempo Real)</p>
                       </div>
                       <h4 className="font-black text-indigo-950 text-xs uppercase">{currentShop.name}</h4>
                       <p className="text-[9px] font-bold text-indigo-600 mt-1">📞 {manualData.senderPhone}</p>
                    </div>
                    {manualData.recipientName && (
                       <div className="bg-indigo-950/90 text-white p-4 rounded-2xl shadow-xl border border-white/10 animate-in slide-in-from-left duration-300">
                          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Destinatário</p>
                          <h4 className="font-black text-xs uppercase">{manualData.recipientName}</h4>
                          <p className="text-[8px] font-bold text-green-400 mt-1">📞 {manualData.phone}</p>
                       </div>
                    )}
                 </div>
              </div>
              
              {/* Painel Direito: Formulário com Dados do Destinatário */}
              <div className="w-full lg:w-[450px] p-8 md:p-12 overflow-y-auto space-y-8 bg-white border-l border-indigo-50">
                 <div className="flex justify-between items-center">
                    <div>
                       <h3 className="text-2xl font-black text-indigo-950 uppercase tracking-tighter">Novo Despacho</h3>
                       <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mt-1">Informe os dados da entrega avulsa</p>
                    </div>
                    <button onClick={() => setShowManualOrder(false)} className="text-indigo-200 hover:text-red-500 transition-colors">✕</button>
                 </div>

                 <div className="space-y-4">
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-indigo-400 uppercase ml-2">Nome de quem vai receber</label>
                       <input className="w-full bg-indigo-50/50 border-0 rounded-xl p-4 font-bold text-indigo-900" placeholder="Nome do Cliente" value={manualData.recipientName} onChange={e => setManualData({...manualData, recipientName: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-indigo-400 uppercase ml-2">Telefone de quem vai receber</label>
                       <input className="w-full bg-indigo-50/50 border-0 rounded-xl p-4 font-bold text-indigo-900" placeholder="(00) 00000-0000" value={manualData.phone} onChange={e => setManualData({...manualData, phone: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-indigo-400 uppercase ml-2">Endereço de Entrega</label>
                       <input className="w-full bg-indigo-50/50 border-0 rounded-xl p-4 font-bold text-indigo-900" placeholder="Rua, Número, Bairro" value={manualData.address} onChange={e => setManualData({...manualData, address: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-indigo-400 uppercase ml-2">O que vai ser entregue?</label>
                       <textarea className="w-full bg-indigo-50/50 border-0 rounded-xl p-4 font-bold text-indigo-900 min-h-[80px]" placeholder="Descrição do objeto ou pedido" value={manualData.description} onChange={e => setManualData({...manualData, description: e.target.value})} />
                    </div>
                 </div>

                 <div className="bg-indigo-950 p-5 rounded-[1.5rem] border border-white/10 flex justify-between items-center text-white">
                    <div>
                       <p className="text-[8px] font-black text-indigo-400 uppercase">Preço Estimado</p>
                       <p className="text-xl font-black text-green-400">R$ {Math.max(paymentSettings.pricing.minFare, 12.00).toFixed(2)}</p>
                    </div>
                    <button onClick={handleConfirmManualOrder} className="bg-green-600 text-white px-8 py-4 rounded-xl font-black uppercase text-[10px] shadow-lg hover:bg-green-500 transition-all">Confirmar Envio</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Modal de Edição de Cardápio - Configuração Total Lojista */}
      {editingItem && (
        <div className="fixed inset-0 bg-indigo-950/90 backdrop-blur-md z-[250] flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl space-y-6 animate-in zoom-in duration-300">
              <h3 className="text-2xl font-black text-indigo-950 uppercase">{editingItem.id ? 'Editar Produto' : 'Novo Produto'}</h3>
              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-indigo-300 uppercase ml-2">Nome</label>
                    <input className="w-full bg-indigo-50 rounded-xl p-4 font-bold" placeholder="Ex: X-Burguer" value={editingItem.name || ''} onChange={e => setEditingItem({...editingItem, name: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-indigo-300 uppercase ml-2">Descrição</label>
                    <textarea className="w-full bg-indigo-50 rounded-xl p-4 font-bold min-h-[80px]" placeholder="Ingredientes e detalhes" value={editingItem.description || ''} onChange={e => setEditingItem({...editingItem, description: e.target.value})} />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-indigo-300 uppercase ml-2">Preço (R$)</label>
                       <input type="number" className="w-full bg-indigo-50 rounded-xl p-4 font-bold" placeholder="25.00" value={editingItem.price ?? ''} onChange={e => setEditingItem({...editingItem, price: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-indigo-300 uppercase ml-2">Link Foto</label>
                       <input className="w-full bg-indigo-50 rounded-xl p-4 font-bold" placeholder="URL da imagem" value={editingItem.image || ''} onChange={e => setEditingItem({...editingItem, image: e.target.value})} />
                    </div>
                 </div>
              </div>
              <div className="pt-4 space-y-3">
                 <button onClick={handleSaveItem} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Salvar Produto</button>
                 <button onClick={() => setEditingItem(null)} className="w-full text-indigo-300 text-[10px] font-black uppercase tracking-widest">Cancelar</button>
              </div>
           </div>
        </div>
      )}

      {/* HUD de Gestão Superior */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
         <div className="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-indigo-50 shadow-sm text-center">
            <p className="text-[8px] md:text-[9px] font-black text-indigo-300 uppercase mb-1 tracking-widest">Vendas Hoje</p>
            <p className="text-xl md:text-2xl font-black text-indigo-950 tracking-tighter">{merchantCRM.day}</p>
         </div>
         <div className="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-indigo-50 shadow-sm text-center">
            <p className="text-[8px] md:text-[9px] font-black text-indigo-300 uppercase mb-1 tracking-widest">Itens Cardápio</p>
            <p className="text-xl md:text-2xl font-black text-indigo-950 tracking-tighter">{currentShop.menu.length}</p>
         </div>
         <div className="bg-indigo-950 p-4 md:p-5 rounded-[1.2rem] md:rounded-[1.5rem] shadow-xl text-center border border-white/5 col-span-2">
            <p className="text-[8px] md:text-[9px] font-black text-indigo-400 uppercase mb-1 tracking-widest">Minha Duarte Cash</p>
            <p className="text-xl md:text-2xl font-black text-green-400 tracking-tighter">R$ {merchantUser.walletBalance.toFixed(2)}</p>
         </div>
      </div>

      {/* Header de Tabs */}
      <header className="bg-white p-4 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-sm border border-indigo-50 flex flex-col lg:flex-row justify-between items-center gap-4 md:gap-6">
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar w-full lg:w-auto">
           {[
             { id: 'OPERATIONS', label: 'Pedidos' },
             { id: 'MENU', label: 'Meu Cardápio' },
             { id: 'CRM', label: 'Estatísticas' },
             { id: 'WALLET', label: 'Carteira' }
           ].map((t) => (
             <button key={t.id} onClick={() => setTab(t.id as any)} className={`text-[9px] md:text-[10px] font-black px-4 md:px-8 py-3 md:py-3.5 rounded-xl md:rounded-2xl uppercase tracking-widest whitespace-nowrap transition-all ${tab === t.id ? 'bg-indigo-900 text-white shadow-xl scale-105' : 'text-indigo-300 hover:bg-indigo-50'}`}>
               {t.label}
             </button>
           ))}
        </div>
        <button onClick={() => setShowManualOrder(true)} className="w-full lg:w-auto bg-green-600 text-white px-8 md:px-10 py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase text-[9px] md:text-[10px] shadow-lg flex items-center justify-center gap-3 hover:bg-black transition-all">
           <TruckIcon /> Despacho Avulso
        </button>
      </header>

      {tab === 'MENU' && (
        <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
           <div className="flex justify-between items-center px-4">
              <div>
                 <h2 className="text-2xl font-black text-indigo-950 uppercase tracking-tighter">Configurar Meus Produtos</h2>
                 <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Gerencie os itens ativos no seu perfil</p>
              </div>
              <button onClick={() => setEditingItem({})} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg">+ Novo Produto</button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentShop.menu.map(item => (
                 <div key={item.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-indigo-50 flex group hover:border-indigo-600 transition-all">
                    <div className="w-32 h-32 bg-indigo-50">
                       <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" alt={item.name} />
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-between">
                       <div>
                          <h4 className="font-black text-indigo-950 text-xs uppercase leading-none mb-1 truncate">{item.name}</h4>
                          <p className="text-[10px] text-indigo-300 font-bold uppercase truncate max-w-[150px]">{item.description}</p>
                       </div>
                       <div className="flex justify-between items-center">
                          <p className="font-black text-indigo-950">R$ {item.price.toFixed(2)}</p>
                          <div className="flex gap-2">
                             <button onClick={() => setEditingItem(item)} className="p-2 text-indigo-400 hover:text-indigo-600">✎</button>
                             <button onClick={() => deleteItem(item.id)} className="p-2 text-red-300 hover:text-red-500"><TrashIcon /></button>
                          </div>
                       </div>
                    </div>
                 </div>
              ))}
              {currentShop.menu.length === 0 && (
                 <div className="md:col-span-3 py-20 bg-white border-2 border-dashed border-indigo-100 rounded-[3rem] text-center">
                    <p className="text-indigo-300 font-black uppercase text-xs">Seu cardápio está vazio. Adicione seu primeiro produto!</p>
                 </div>
              )}
           </div>
        </div>
      )}

      {tab === 'OPERATIONS' && (
         <div className="space-y-4">
            {orders.length === 0 ? (
               <div className="bg-white p-20 rounded-[4rem] text-center border border-indigo-50 text-indigo-200 uppercase font-black tracking-widest opacity-30">Sem pedidos no momento</div>
            ) : (
               orders.map(order => (
                  <div key={order.id} className="bg-white p-8 rounded-[3rem] border border-indigo-50 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-indigo-600 transition-all">
                     <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                           <span className="text-[9px] font-black px-3 py-1 bg-indigo-950 text-white rounded-full uppercase">{order.type}</span>
                           <span className="text-[10px] font-black text-indigo-300 uppercase">#{order.id.slice(-6)}</span>
                        </div>
                        <h4 className="font-black text-indigo-950 text-lg uppercase tracking-tight">{order.parcelDetails?.recipientName || order.userName}</h4>
                        <p className="text-[10px] font-bold text-indigo-400 uppercase truncate max-w-xs">{order.parcelDetails?.destination || 'Entrega Local'}</p>
                     </div>
                     <div className="text-center px-6 border-x border-indigo-50">
                        <p className="text-[10px] font-black text-indigo-300 uppercase mb-1">Total</p>
                        <p className="text-xl font-black text-indigo-950 tracking-tighter">R$ {order.total.toFixed(2)}</p>
                     </div>
                     <div className="flex gap-2">
                        {order.status === OrderStatus.PENDING && (
                           <button onClick={() => onUpdateStatus(order.id, OrderStatus.PREPARING)} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg">Aceitar</button>
                        )}
                        {order.status === OrderStatus.PREPARING && (
                           <button onClick={() => onUpdateStatus(order.id, OrderStatus.READY)} className="bg-amber-500 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg">Pronto p/ Coleta</button>
                        )}
                        <span className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase ${order.status === OrderStatus.DELIVERED || order.status === OrderStatus.COMPLETED ? 'bg-green-100 text-green-600' : 'bg-indigo-50 text-indigo-300'}`}>
                           {order.status}
                        </span>
                     </div>
                  </div>
               ))
            )}
         </div>
      )}

      {tab === 'CRM' && (
         <div className="bg-white p-10 rounded-[3.5rem] border border-indigo-50 shadow-sm space-y-6">
            <h2 className="text-2xl font-black text-indigo-950 uppercase">Insights do Estabelecimento</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-indigo-50/50 p-8 rounded-[2.5rem] border border-indigo-100">
                  <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-4">Vendas Finalizadas</p>
                  <p className="text-4xl font-black text-indigo-950 tracking-tighter">
                     {orders.filter(o => (o.status === OrderStatus.COMPLETED || o.status === OrderStatus.DELIVERED) && o.shopId === currentShop.id).length}
                  </p>
               </div>
               <div className="bg-green-50/50 p-8 rounded-[2.5rem] border border-green-100">
                  <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-4">Receita Total</p>
                  <p className="text-4xl font-black text-green-700 tracking-tighter">
                     R$ {orders.filter(o => (o.status === OrderStatus.COMPLETED || o.status === OrderStatus.DELIVERED) && o.shopId === currentShop.id).reduce((acc, o) => acc + o.total, 0).toFixed(2)}
                  </p>
               </div>
            </div>
         </div>
      )}

      {tab === 'WALLET' && (
         <div className="max-w-4xl mx-auto space-y-10 animate-in zoom-in duration-300">
            <div className="text-center">
               <h2 className="text-3xl font-black text-indigo-950 uppercase border-b border-indigo-50 pb-4">Recarga Duarte Cash</h2>
               <p className="text-[10px] text-indigo-400 font-black uppercase mt-4 tracking-widest">Seu saldo para fretes e despachos avulsos</p>
            </div>

            {/* Ativação de Código para Lojista */}
            <div className="bg-indigo-900 text-white p-8 rounded-[3rem] shadow-xl space-y-4">
               <div className="text-center">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Resgatar Código de Recarga</p>
               </div>
               <div className="flex gap-4">
                  <input 
                    className="flex-1 bg-white/10 border-0 rounded-2xl p-4 font-black text-center text-lg uppercase tracking-widest outline-none focus:ring-2 focus:ring-green-500" 
                    placeholder="CÓDIGO AQUI" 
                    value={activationCodeInput}
                    onChange={e => setActivationCodeInput(e.target.value)}
                  />
                  <button 
                    onClick={handleRedeem}
                    disabled={isRedeeming}
                    className="bg-green-600 px-6 py-4 rounded-2xl font-black uppercase text-[10px] hover:bg-green-500 transition-all disabled:opacity-50"
                  >
                    {isRedeeming ? 'Validando...' : 'Ativar'}
                  </button>
               </div>
            </div>

            <div className="space-y-6">
               <div className="text-center">
                  <h3 className="text-2xl font-black text-indigo-950 uppercase">Catálogo de Créditos para Lojistas</h3>
                  <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Adquira saldo via link externo seguro</p>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {(paymentSettings.pricing.topUpProducts || []).map(product => (
                     <div key={product.id} className="bg-white p-8 rounded-[3rem] border-2 border-indigo-50 shadow-sm hover:border-indigo-600 hover:shadow-xl transition-all group flex flex-col justify-between items-center text-center space-y-4 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
                        <div>
                           <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-2 text-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all">🏦</div>
                           <h4 className="text-lg font-black text-indigo-950 uppercase">{product.name}</h4>
                        </div>
                        <div>
                           <p className="text-3xl font-black text-green-600 tracking-tighter mb-4">R$ {product.amount.toFixed(2)}</p>
                           <button 
                              onClick={() => handleBuyCredits(product)} 
                              className="w-full bg-indigo-950 text-white py-4 px-8 rounded-2xl font-black uppercase text-[10px] shadow-lg hover:bg-black transition-all"
                           >
                              Compras
                           </button>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default MerchantView;

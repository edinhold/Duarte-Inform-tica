
import React, { useState, useEffect, useRef } from 'react';
import { Shop, MenuItem, Order, OrderStatus, ServiceType, PaymentMethod, Location, User, ApiSettings } from '../types';
import { MOCK_SHOPS } from '../constants';
import { CartIcon, TrashIcon, StoreIcon, TruckIcon, UserIcon, MapPinIcon } from '../components/Icons';
import { geminiService } from '../services/geminiService';
import MapView from '../components/MapView';

interface CartItem extends MenuItem {
  quantity: number;
}

interface UserViewProps {
  onPlaceOrder: (data: any, type: ServiceType, payment: PaymentMethod) => void;
  onRateOrder: (orderId: string, merchantRating?: number, driverRating?: number) => void;
  allOrders: Order[];
  currentUser: User;
  paymentSettings: ApiSettings;
  onTopUp: (amount: number) => void;
}

const UserView: React.FC<UserViewProps> = ({ onPlaceOrder, onRateOrder, allOrders, currentUser, paymentSettings, onTopUp }) => {
  const [viewMode, setViewMode] = useState<'HOME' | 'FOOD' | 'PARCEL' | 'RIDE' | 'HISTORY' | 'CHECKOUT' | 'TRACKING' | 'WALLET'>('HOME');
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>(
    currentUser.walletBalance > 0 ? PaymentMethod.WALLET : (paymentSettings.activeMethods[0] || PaymentMethod.CASH)
  );
  
  const [rideDetails, setRideDetails] = useState({ origin: '', destination: '' });
  const [parcelDetails, setParcelDetails] = useState({ description: '', destination: '' });
  const [estimatedPrice, setEstimatedPrice] = useState(0);

  const activeOrder = allOrders.find(o => o.userId === currentUser.id && ![OrderStatus.COMPLETED, OrderStatus.DELIVERED, OrderStatus.CANCELLED].includes(o.status));

  // A função pré-pago agora está sempre disponível se o admin permitir
  const isPrepaidEnabled = true;

  useEffect(() => {
    if (viewMode === 'RIDE' || viewMode === 'PARCEL') {
      const simulatedDistance = 5.2; 
      const pricing = paymentSettings.pricing;
      let price = pricing.baseFee + (simulatedDistance * pricing.perKmRate);
      const dest = (viewMode === 'RIDE' ? rideDetails.destination : parcelDetails.destination).toLowerCase();
      const matchedRegion = pricing.regions.find(r => dest.includes(r.name.toLowerCase()));
      if (matchedRegion) price += matchedRegion.surcharge;
      const finalPrice = Math.max(price, pricing.minFare);
      setEstimatedPrice(finalPrice);
    }
  }, [rideDetails.destination, parcelDetails.destination, viewMode, paymentSettings.pricing]);

  const confirmOrder = (type: ServiceType) => {
    const total = type === ServiceType.FOOD ? cart.reduce((a,b)=>a+(b.price*b.quantity),0) : estimatedPrice;
    if (selectedPayment === PaymentMethod.WALLET && currentUser.walletBalance < total) {
      alert("Saldo insuficiente na Carteira Duarte! Por favor, recarregue ou escolha outro método.");
      setViewMode('WALLET');
      return;
    }
    const data = type === ServiceType.FOOD 
      ? { items: cart, shop: selectedShop, total } 
      : (type === ServiceType.RIDE ? { rideDetails, total: estimatedPrice } : { parcelDetails, total: estimatedPrice });
    onPlaceOrder(data, type, selectedPayment);
    setCart([]);
    setSelectedShop(null);
    setViewMode('HOME');
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const renderWallet = () => (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <header className="flex items-center gap-4">
        <button onClick={() => setViewMode('HOME')} className="text-indigo-400 font-bold text-sm">← Voltar</button>
        <h2 className="text-xl font-black text-indigo-950">Carteira Duarte</h2>
      </header>
      
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 text-white p-10 rounded-[3rem] shadow-2xl space-y-8 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 -mr-10 -mb-10 scale-150 rotate-12">
           <div className="w-64 h-64 border-[20px] border-white rounded-full"></div>
        </div>
        <div className="relative z-10 flex justify-between items-start">
           <div>
              <h2 className="text-xs font-black uppercase tracking-[0.2em] opacity-60">Saldo em Duarte Cash</h2>
              <p className="text-5xl font-black mt-2">R$ {currentUser.walletBalance.toFixed(2)}</p>
           </div>
           <div className="bg-white/10 p-3 rounded-2xl">
              <span className="text-2xl">💳</span>
           </div>
        </div>
        <div className="relative z-10 grid grid-cols-2 gap-4">
           <button onClick={() => onTopUp(20)} className="bg-white/20 hover:bg-white/30 py-4 rounded-2xl font-bold transition-all text-xs uppercase tracking-widest">+ R$ 20,00</button>
           <button onClick={() => onTopUp(50)} className="bg-white/20 hover:bg-white/30 py-4 rounded-2xl font-bold transition-all text-xs uppercase tracking-widest">+ R$ 50,00</button>
           <button onClick={() => onTopUp(100)} className="bg-white/20 hover:bg-white/30 py-4 rounded-2xl font-bold transition-all text-xs uppercase tracking-widest">+ R$ 100,00</button>
           <button onClick={() => onTopUp(200)} className="bg-white text-indigo-900 hover:bg-indigo-50 py-4 rounded-2xl font-black transition-all text-xs uppercase tracking-widest shadow-xl">+ R$ 200,00</button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-indigo-50">
         <h3 className="text-sm font-black text-indigo-950 uppercase tracking-widest mb-6">Por que usar o Pré-pago?</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex gap-4 items-start">
               <div className="bg-green-100 text-green-600 p-3 rounded-2xl text-xl">🚀</div>
               <div>
                  <h4 className="font-bold text-indigo-950 text-sm">Checkout Instantâneo</h4>
                  <p className="text-[10px] text-indigo-400">Pague seus pedidos com apenas um clique, sem precisar de cartão físico ou Pix externo.</p>
               </div>
            </div>
            <div className="flex gap-4 items-start">
               <div className="bg-amber-100 text-amber-600 p-3 rounded-2xl text-xl">🛡️</div>
               <div>
                  <h4 className="font-bold text-indigo-950 text-sm">Controle Total</h4>
                  <p className="text-[10px] text-indigo-400">Defina um orçamento mensal para suas entregas e tenha mais segurança em suas transações.</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );

  const getMethodLabel = (method: PaymentMethod) => {
    switch(method) {
      case PaymentMethod.PIX: return 'PIX';
      case PaymentMethod.CREDIT_CARD: return 'Cartão de Crédito';
      case PaymentMethod.CASH: return 'Dinheiro';
      case PaymentMethod.BOLETO: return 'Boleto Bancário';
      case PaymentMethod.WALLET: return 'Carteira Duarte (Cash)';
      default: return method;
    }
  };

  return (
    <div className="min-h-screen">
      {viewMode === 'WALLET' && renderWallet()}
      {viewMode === 'HOME' && (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
          <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] shadow-sm border border-indigo-50 animate-in slide-in-from-top">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-900 text-white rounded-2xl flex items-center justify-center shadow-lg"><UserIcon /></div>
                <div>
                   <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Saldo Duarte Cash</p>
                   <p className="text-2xl font-black text-indigo-950">R$ {currentUser.walletBalance.toFixed(2)}</p>
                </div>
             </div>
             <button onClick={() => setViewMode('WALLET')} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl text-xs font-black shadow-xl shadow-indigo-100 transition-all hover:bg-black uppercase tracking-widest">Recarregar</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button onClick={() => setViewMode('FOOD')} className="bg-white p-8 rounded-[3rem] border-2 border-transparent hover:border-orange-500 transition-all flex flex-col items-center shadow-sm group">
              <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><StoreIcon /></div>
              <h3 className="text-lg font-black text-indigo-950">Restaurantes</h3>
              <p className="text-[10px] text-indigo-300 font-bold uppercase mt-1">Refeições e Lanches</p>
            </button>
            <button onClick={() => setViewMode('PARCEL')} className="bg-white p-8 rounded-[3rem] border-2 border-transparent hover:border-blue-500 transition-all flex flex-col items-center shadow-sm group">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><TruckIcon /></div>
              <h3 className="text-lg font-black text-indigo-950">Encomendas</h3>
              <p className="text-[10px] text-indigo-300 font-bold uppercase mt-1">Documentos e Volumes</p>
            </button>
            <button onClick={() => setViewMode('RIDE')} className="bg-white p-8 rounded-[3rem] border-2 border-transparent hover:border-green-500 transition-all flex flex-col items-center shadow-sm group">
              <div className="w-16 h-16 bg-green-100 text-green-700 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><UserIcon /></div>
              <h3 className="text-lg font-black text-indigo-950">Viagens</h3>
              <p className="text-[10px] text-indigo-300 font-bold uppercase mt-1">Carro ou Moto</p>
            </button>
          </div>
        </div>
      )}

      {(viewMode === 'FOOD' || viewMode === 'RIDE' || viewMode === 'PARCEL') && !selectedShop && (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
           <header className="flex items-center gap-4">
              <button onClick={() => setViewMode('HOME')} className="text-indigo-400 font-bold text-sm">← Voltar</button>
              <h2 className="text-xl font-black text-indigo-950">{viewMode === 'FOOD' ? 'Restaurantes' : viewMode === 'RIDE' ? 'Chamar Viagem' : 'Enviar Encomenda'}</h2>
           </header>
           {viewMode === 'FOOD' && (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {MOCK_SHOPS.map(shop => (
                  <button key={shop.id} onClick={() => setSelectedShop(shop)} className="bg-white p-4 rounded-[2rem] border hover:border-indigo-200 transition-all text-left group">
                     <div className="relative overflow-hidden rounded-2xl mb-3 h-32">
                        <img src={shop.image} alt={shop.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                     </div>
                     <h4 className="font-black text-indigo-950">{shop.name}</h4>
                     <p className="text-xs text-indigo-300 font-medium">{shop.category}</p>
                  </button>
                ))}
             </div>
           )}
           {viewMode === 'RIDE' && (
             <div className="max-w-md mx-auto bg-white p-8 rounded-[3rem] shadow-sm border space-y-6">
                <input value={rideDetails.destination} onChange={e => setRideDetails({...rideDetails, destination: e.target.value})} placeholder="Para onde vamos?" className="w-full bg-indigo-50 border-0 rounded-2xl p-4 font-bold text-indigo-950" />
                <div className="bg-green-50 p-8 rounded-[2rem] border border-green-100 flex justify-between items-center shadow-inner">
                   <div>
                      <p className="text-[10px] font-black uppercase text-green-600 tracking-widest">Estimativa</p>
                      <p className="font-black text-green-900 text-3xl">R$ {estimatedPrice.toFixed(2)}</p>
                   </div>
                </div>
                <button onClick={() => setViewMode('CHECKOUT')} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-xl hover:bg-black transition-all text-lg uppercase tracking-widest">Solicitar agora</button>
             </div>
           )}
        </div>
      )}

      {selectedShop && viewMode !== 'CHECKOUT' && (
        <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
           <button onClick={() => setSelectedShop(null)} className="text-indigo-400 font-bold text-sm">← Restaurantes</button>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-xl font-black text-indigo-950 mb-4">{selectedShop.name} - Cardápio</h3>
                {selectedShop.menu.map(item => (
                  <div key={item.id} className="bg-white p-4 rounded-[2rem] border flex items-center gap-4 hover:border-indigo-100 transition-all">
                     <div className="flex-1">
                        <h4 className="font-black text-indigo-950">{item.name}</h4>
                        <p className="text-[10px] text-indigo-300 font-bold italic">{item.description}</p>
                        <p className="font-black text-indigo-600 mt-1">R$ {item.price.toFixed(2)}</p>
                     </div>
                     <button onClick={() => addToCart(item)} className="bg-indigo-600 text-white w-12 h-12 rounded-2xl font-black text-xl hover:bg-black transition-all shadow-lg shadow-indigo-100">+</button>
                  </div>
                ))}
              </div>
              <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-indigo-50 h-fit sticky top-24 space-y-6">
                <h3 className="font-black text-indigo-950 text-lg uppercase tracking-tight">Seu Carrinho</h3>
                {cart.length === 0 ? (
                  <p className="text-indigo-200 text-sm font-bold italic py-10 text-center bg-indigo-50/20 rounded-[2rem]">Nenhum item adicionado.</p>
                ) : (
                  <div className="space-y-4">
                    {cart.map(item => (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                        <span className="text-indigo-950 font-black">{item.quantity}x {item.name}</span>
                        <span className="text-indigo-600 font-bold">R$ {(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="pt-6 border-t border-indigo-50 flex justify-between items-end">
                       <div>
                          <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Total do Pedido</p>
                          <p className="text-3xl font-black text-indigo-950">R$ {cart.reduce((a,b)=>a+(b.price*b.quantity),0).toFixed(2)}</p>
                       </div>
                    </div>
                  </div>
                )}
                <button onClick={() => setViewMode('CHECKOUT')} disabled={cart.length === 0} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-xl hover:bg-black disabled:opacity-30 transition-all uppercase tracking-widest">Ir para o Pagamento</button>
              </div>
           </div>
        </div>
      )}

      {viewMode === 'CHECKOUT' && (
        <div className="max-w-md mx-auto p-10 bg-white rounded-[4rem] shadow-2xl border border-indigo-50 space-y-8 mt-10">
          <header className="flex items-center gap-4 mb-6">
              <button onClick={() => setViewMode('HOME')} className="text-indigo-400 font-bold text-sm">← Voltar</button>
              <h2 className="text-2xl font-black text-indigo-950 tracking-tight">Pagamento</h2>
          </header>
          
          <div className="space-y-3">
             {/* Método de pagamento Pré-pago em destaque */}
             <button 
                onClick={() => setSelectedPayment(PaymentMethod.WALLET)} 
                className={`w-full p-6 rounded-[2rem] border-2 font-black text-left flex justify-between items-center transition-all ${
                  selectedPayment === PaymentMethod.WALLET ? 'border-indigo-600 bg-indigo-50 text-indigo-600 ring-4 ring-indigo-50' : 'border-indigo-50 bg-indigo-50/30 text-indigo-300'
                }`}
             >
                <div>
                   <span className="block">Carteira Duarte</span>
                   <span className="text-[10px] opacity-60">Saldo: R$ {currentUser.walletBalance.toFixed(2)}</span>
                </div>
                {selectedPayment === PaymentMethod.WALLET && <span className="text-xl">💳</span>}
             </button>

             <div className="relative py-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-indigo-50"></div></div>
                <div className="relative flex justify-center"><span className="bg-white px-4 text-[10px] font-black text-indigo-200 uppercase tracking-widest">Ou outros métodos</span></div>
             </div>

             <div className="grid grid-cols-2 gap-3">
              {paymentSettings.activeMethods.filter(m => m !== PaymentMethod.WALLET).map(m => (
                <button 
                  key={m} 
                  onClick={() => setSelectedPayment(m)} 
                  className={`p-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${
                    selectedPayment === m ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-gray-50 bg-gray-50/50 text-gray-400'
                  }`}
                >
                  {getMethodLabel(m)}
                </button>
              ))}
             </div>
          </div>
          
          <div className="p-8 bg-indigo-950 text-white rounded-[2.5rem] shadow-xl text-center">
             <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">Total a Pagar</p>
             <p className="text-4xl font-black">R$ {cart.length > 0 ? cart.reduce((a,b)=>a+(b.price*b.quantity),0).toFixed(2) : estimatedPrice.toFixed(2)}</p>
          </div>

          <button 
            onClick={() => confirmOrder(selectedShop ? ServiceType.FOOD : (rideDetails.destination ? ServiceType.RIDE : ServiceType.PARCEL))} 
            className="w-full py-5 rounded-2xl font-black shadow-2xl transition-all text-lg bg-indigo-600 text-white hover:bg-black active:scale-95 shadow-indigo-100 uppercase tracking-widest"
          >
            Confirmar e Pagar
          </button>
        </div>
      )}
    </div>
  );
};

export default UserView;

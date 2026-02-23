
import React, { useState, useEffect, useMemo } from 'react';
import { Shop, MenuItem, Order, OrderStatus, ServiceType, PaymentMethod, User, ApiSettings, Location, TopUpProduct, ActivationCode } from '../types';
import { StoreIcon, TruckIcon, UserIcon, CartIcon, MapPinIcon } from '../components/Icons';
import MapView from '../components/MapView';

interface UserViewProps {
  onPlaceOrder: (data: any, type: ServiceType, payment: PaymentMethod) => void;
  onRateOrder: (orderId: string, merchantRating?: number, driverRating?: number) => void;
  allOrders: Order[];
  currentUser: User;
  paymentSettings: ApiSettings;
  onTopUp: (amount: number) => void;
  shops: Shop[];
  users: User[];
  onRedeemCode: (code: string) => Promise<boolean>;
}

const UserView: React.FC<UserViewProps> = ({ 
  onPlaceOrder, allOrders, currentUser, paymentSettings, onTopUp, shops, users, onRedeemCode 
}) => {
  const [viewMode, setViewMode] = useState<'HOME' | 'SHOPS' | 'MENU' | 'PARCEL' | 'RIDE' | 'HISTORY' | 'CHECKOUT' | 'WALLET'>('HOME');
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [cart, setCart] = useState<{item: MenuItem, quantity: number}[]>([]);
  const [activationCodeInput, setActivationCodeInput] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  
  // Estados para GPS e Formulários
  const [userLocation, setUserLocation] = useState<Location>({ lat: -23.5505, lng: -46.6333 });
  const [rideDestination, setRideDestination] = useState('');
  const [parcelData, setParcelData] = useState({
    senderName: currentUser.name,
    senderPhone: currentUser.phone || '',
    recipientName: '',
    recipientPhone: '',
    address: '',
    description: ''
  });

  // Monitorar GPS em tempo real
  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.error("Erro GPS:", error),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  const handleRedeem = async () => {
    if (!activationCodeInput.trim()) return;
    setIsRedeeming(true);
    const success = await onRedeemCode(activationCodeInput.toUpperCase().trim());
    if (success) {
      setActivationCodeInput('');
      alert("Sucesso! O saldo do código foi adicionado à sua carteira.");
    } else {
      alert("Código inválido, expirado ou já utilizado.");
    }
    setIsRedeeming(false);
  };

  const handleBuyCredits = (product: TopUpProduct) => {
    if (product.purchaseLink) {
      window.open(product.purchaseLink, '_blank');
    } else {
      alert("Este pacote não possui um link de compra configurado.");
    }
  };

  const handleConfirmRide = () => {
    if (!rideDestination) return alert("Por favor, informe para onde você vai.");
    const distance = 3.5; // Simulação de distância
    const total = Math.max(paymentSettings.pricing.minFare, paymentSettings.pricing.baseFee + (distance * paymentSettings.pricing.perKmRate));
    
    onPlaceOrder({
      total,
      distance,
      rideDetails: { origin: 'Sua Localização Atual', destination: rideDestination }
    }, ServiceType.RIDE, PaymentMethod.WALLET);
    
    alert("Procurando motorista próximo...");
    setViewMode('HOME');
  };

  const handleConfirmParcel = () => {
    const { senderName, senderPhone, recipientName, recipientPhone, address, description } = parcelData;
    if (!recipientName || !recipientPhone || !address || !description) {
      return alert("Preencha todos os dados da entrega.");
    }
    
    const distance = 5.2; // Simulação de distância
    const total = Math.max(paymentSettings.pricing.minFare, paymentSettings.pricing.baseFee + (distance * paymentSettings.pricing.perKmRate));

    onPlaceOrder({
      total,
      distance,
      parcelDetails: {
        senderName,
        senderPhone,
        recipientName,
        recipientPhone,
        destination: address,
        description
      }
    }, ServiceType.PARCEL, PaymentMethod.WALLET);

    alert("Encomenda solicitada! Um entregador virá coletar o objeto.");
    setViewMode('HOME');
  };

  const handleAddToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.item.id === item.id);
      if (existing) {
        return prev.map(i => i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.item.id !== itemId));
  };

  const handlePlaceFoodOrder = () => {
    if (!selectedShop || cart.length === 0) return;
    const total = cart.reduce((acc, i) => acc + (i.item.price * i.quantity), 0);
    
    if (currentUser.walletBalance < total) {
      alert("Saldo insuficiente na carteira Duarte Cash.");
      return;
    }

    onPlaceOrder({
      total,
      shop: selectedShop,
      items: cart.map(i => ({ menuItemId: i.item.id, quantity: i.quantity, name: i.item.name, price: i.item.price }))
    }, ServiceType.FOOD, PaymentMethod.WALLET);

    alert("Pedido realizado com sucesso! O restaurante está preparando seu pedido.");
    setCart([]);
    setSelectedShop(null);
    setViewMode('HOME');
  };

  const mapMarkers = useMemo(() => {
    const markers: any[] = [{ position: userLocation, label: 'Você está aqui', type: 'USER' }];
    if (rideDestination && viewMode === 'RIDE') {
      markers.push({ 
        position: { lat: userLocation.lat + 0.01, lng: userLocation.lng + 0.01 }, 
        label: `Destino: ${rideDestination}`, 
        type: 'SHOP' 
      });
    }
    return markers;
  }, [userLocation, rideDestination, viewMode]);

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20 relative">
      <div className="relative mb-12">
         <header className="relative bg-indigo-950 p-8 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl overflow-hidden border border-white/5">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full -mr-24 -mt-24 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-green-500/10 rounded-full -ml-16 -mb-16 blur-3xl"></div>
            
            <div className="relative flex flex-col md:flex-row justify-between items-center gap-8">
               <div className="flex items-center gap-6">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-white text-indigo-950 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center font-black text-3xl md:text-4xl shadow-2xl shrink-0">D</div>
                  <div>
                     <p className="text-[10px] md:text-xs font-black text-indigo-400 uppercase tracking-[0.4em] mb-2">Duarte Cash Balance</p>
                     <h4 className="text-4xl md:text-5xl font-black text-white tracking-tighter">R$ {currentUser.walletBalance.toFixed(2)}</h4>
                  </div>
               </div>
               {/* Espaço para o botão flutuante no mobile */}
               <div className="h-10 md:hidden"></div>
            </div>
         </header>
         <button 
            onClick={() => setViewMode('WALLET')} 
            className="absolute -bottom-6 right-8 md:right-16 bg-green-500 text-indigo-950 px-10 py-5 rounded-2xl font-black text-xs uppercase shadow-2xl hover:bg-white transition-all transform hover:scale-105 active:scale-95 z-20"
         >
            Recarregar Saldo
         </button>
      </div>

      {viewMode === 'HOME' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-10 pt-8">
           <button onClick={() => setViewMode('SHOPS')} className="bg-white p-10 md:p-14 rounded-[3rem] md:rounded-[4rem] border border-indigo-50 shadow-sm hover:shadow-2xl transition-all group">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-indigo-50 text-indigo-600 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-6 md:mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-all"><StoreIcon /></div>
              <p className="text-center font-black text-indigo-950 uppercase tracking-tight text-base md:text-lg">Restaurantes</p>
              <p className="text-center text-[10px] text-indigo-300 font-bold uppercase mt-2 opacity-0 group-hover:opacity-100 transition-all">Pedir Comida</p>
           </button>
           <button onClick={() => setViewMode('PARCEL')} className="bg-white p-10 md:p-14 rounded-[3rem] md:rounded-[4rem] border border-indigo-50 shadow-sm hover:shadow-2xl transition-all group">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-amber-50 text-amber-600 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-6 md:mb-8 group-hover:bg-amber-600 group-hover:text-white transition-all"><TruckIcon /></div>
              <p className="text-center font-black text-indigo-950 uppercase tracking-tight text-base md:text-lg">Encomendas</p>
              <p className="text-center text-[10px] text-indigo-300 font-bold uppercase mt-2 opacity-0 group-hover:opacity-100 transition-all">Enviar Pacote</p>
           </button>
           <button onClick={() => setViewMode('RIDE')} className="bg-white p-10 md:p-14 rounded-[3rem] md:rounded-[4rem] border border-indigo-50 shadow-sm hover:shadow-2xl transition-all group sm:col-span-2 md:col-span-1">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-green-50 text-green-600 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-6 md:mb-8 group-hover:bg-green-600 group-hover:text-white transition-all"><UserIcon /></div>
              <p className="text-center font-black text-indigo-950 uppercase tracking-tight text-base md:text-lg">Corridas</p>
              <p className="text-center text-[10px] text-indigo-300 font-bold uppercase mt-2 opacity-0 group-hover:opacity-100 transition-all">Pedir Viagem</p>
           </button>
        </div>
      )}

      {viewMode === 'SHOPS' && (
        <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
          <div className="flex justify-between items-center px-4">
            <div>
              <h2 className="text-2xl font-black text-indigo-950 uppercase tracking-tighter">Restaurantes e Lojas</h2>
              <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Os melhores estabelecimentos da sua região</p>
            </div>
            <button onClick={() => setViewMode('HOME')} className="text-indigo-400 font-black text-[10px] uppercase tracking-widest">Voltar</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map(shop => (
              <button 
                key={shop.id} 
                onClick={() => { setSelectedShop(shop); setViewMode('MENU'); }}
                className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-indigo-50 group hover:border-indigo-600 transition-all text-left"
              >
                <div className="h-48 bg-indigo-50 relative overflow-hidden">
                  <img src={shop.image} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" alt={shop.name} />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-indigo-950 shadow-sm">
                    ★ {shop.rating.toFixed(1)}
                  </div>
                </div>
                <div className="p-6">
                  <h4 className="font-black text-indigo-950 text-lg uppercase tracking-tight mb-1">{shop.name}</h4>
                  <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">{shop.category}</p>
                </div>
              </button>
            ))}
            {shops.length === 0 && (
              <div className="md:col-span-3 py-20 text-center text-indigo-300 font-black uppercase text-xs">Nenhum restaurante disponível no momento</div>
            )}
          </div>
        </div>
      )}

      {viewMode === 'MENU' && selectedShop && (
        <div className="space-y-8 animate-in slide-in-from-right duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-4">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-indigo-50 rounded-[2rem] overflow-hidden border-4 border-white shadow-xl">
                <img src={selectedShop.image} className="w-full h-full object-cover" alt={selectedShop.name} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-indigo-950 uppercase tracking-tighter">{selectedShop.name}</h2>
                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">{selectedShop.category} • ★ {selectedShop.rating.toFixed(1)}</p>
              </div>
            </div>
            <button onClick={() => setViewMode('SHOPS')} className="bg-white text-indigo-600 px-8 py-3 rounded-xl font-black text-[10px] uppercase shadow-sm border border-indigo-50 hover:bg-indigo-50 transition-all">← Ver Outros</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-xl font-black text-indigo-950 uppercase tracking-tight px-4">Cardápio</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedShop.menu.map(item => (
                  <div key={item.id} className="bg-white p-4 rounded-[2rem] border border-indigo-50 shadow-sm flex gap-4 group hover:border-indigo-600 transition-all">
                    <div className="w-24 h-24 bg-indigo-50 rounded-2xl overflow-hidden shrink-0">
                      <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500" alt={item.name} />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-black text-indigo-950 text-xs uppercase mb-1">{item.name}</h4>
                        <p className="text-[10px] text-indigo-300 font-bold uppercase line-clamp-2">{item.description}</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="font-black text-indigo-950">R$ {item.price.toFixed(2)}</p>
                        <button onClick={() => handleAddToCart(item)} className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center shadow-lg hover:bg-black transition-all">+</button>
                      </div>
                    </div>
                  </div>
                ))}
                {selectedShop.menu.length === 0 && (
                  <div className="md:col-span-2 py-20 text-center text-indigo-300 font-black uppercase text-xs">Este restaurante ainda não configurou o cardápio.</div>
                )}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-indigo-950 text-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl sticky top-24">
                <div className="flex items-center gap-3 mb-6">
                  <CartIcon />
                  <h3 className="text-xl font-black uppercase tracking-tighter">Seu Carrinho</h3>
                </div>

                <div className="space-y-4 max-h-[40vh] overflow-y-auto no-scrollbar mb-8">
                  {cart.map(item => (
                    <div key={item.item.id} className="flex justify-between items-center gap-4">
                      <div className="flex-1">
                        <p className="text-xs font-black uppercase truncate">{item.item.name}</p>
                        <p className="text-[10px] text-indigo-400 font-bold uppercase">{item.quantity}x R$ {item.item.price.toFixed(2)}</p>
                      </div>
                      <button onClick={() => handleRemoveFromCart(item.item.id)} className="text-red-400 hover:text-red-300">✕</button>
                    </div>
                  ))}
                  {cart.length === 0 && (
                    <p className="text-center text-indigo-400 font-bold uppercase text-[10px] py-10">Seu carrinho está vazio</p>
                  )}
                </div>

                <div className="pt-8 border-t border-white/10 space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-indigo-400 uppercase">Total do Pedido</span>
                    <span className="text-2xl font-black text-green-400">R$ {cart.reduce((acc, i) => acc + (i.item.price * i.quantity), 0).toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={handlePlaceFoodOrder}
                    disabled={cart.length === 0}
                    className={`w-full bg-green-600 text-white py-5 rounded-2xl font-black uppercase text-xs shadow-xl transition-all ${cart.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-500 active:scale-95'}`}
                  >
                    Finalizar Pedido
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'RIDE' && (
        <div className="h-[500px] md:h-[600px] bg-white rounded-[2.5rem] md:rounded-[4rem] border border-indigo-50 shadow-2xl relative overflow-hidden flex flex-col md:flex-row animate-in slide-in-from-bottom duration-500">
           <div className="flex-1 relative min-h-[250px] md:min-h-0">
              <MapView markers={mapMarkers} center={userLocation} showRouteLine={true} />
              <div className="absolute top-4 md:top-6 left-4 md:left-6 z-10 bg-white/90 backdrop-blur-md p-3 md:p-4 rounded-xl md:rounded-2xl shadow-xl border border-indigo-100 flex items-center gap-2 md:gap-3">
                 <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full animate-ping"></div>
                 <p className="text-[8px] md:text-[10px] font-black text-indigo-900 uppercase">GPS Ativo: Você está aqui</p>
              </div>
           </div>
           <div className="w-full md:w-[350px] lg:w-[400px] p-6 md:p-10 bg-white border-t md:border-t-0 md:border-l border-indigo-50 flex flex-col justify-between space-y-6 md:space-y-8">
              <div className="space-y-6">
                 <div>
                    <h3 className="text-2xl font-black text-indigo-950 uppercase tracking-tighter">Para onde vamos?</h3>
                    <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest mt-1">Informe seu destino no GPS</p>
                 </div>
                 <div className="space-y-4">
                    <div className="bg-indigo-50/50 p-4 rounded-2xl flex items-center gap-4">
                       <div className="w-8 h-8 bg-green-600 text-white rounded-xl flex items-center justify-center text-xs shadow-lg shadow-green-100">🏁</div>
                       <input 
                          className="flex-1 bg-transparent border-0 font-bold text-indigo-900 focus:ring-0" 
                          placeholder="Digite o endereço de destino" 
                          value={rideDestination}
                          onChange={e => setRideDestination(e.target.value)}
                       />
                    </div>
                 </div>
              </div>
              <div className="space-y-4 pt-6 border-t border-indigo-50">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-indigo-300 uppercase">Estimativa de Preço</span>
                    <span className="text-2xl font-black text-indigo-950">R$ {Math.max(paymentSettings.pricing.minFare, 15.00).toFixed(2)}</span>
                 </div>
                 <button onClick={handleConfirmRide} className="w-full bg-indigo-950 text-white py-5 rounded-[1.5rem] font-black uppercase text-xs shadow-xl hover:bg-black transition-all">Solicitar Motorista</button>
                 <button onClick={() => setViewMode('HOME')} className="w-full text-indigo-300 font-black text-[9px] uppercase tracking-widest">Cancelar e Voltar</button>
              </div>
           </div>
        </div>
      )}

      {viewMode === 'PARCEL' && (
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-right duration-500">
           <div className="bg-white p-12 rounded-[4rem] border border-indigo-50 shadow-sm space-y-8">
              <div>
                 <h3 className="text-2xl font-black text-indigo-950 uppercase tracking-tighter">Dados do Envio</h3>
                 <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">Quem está enviando o pacote</p>
              </div>
              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-indigo-400 uppercase ml-2">Nome do Remetente</label>
                    <input className="w-full bg-indigo-50/30 border-0 rounded-2xl p-5 font-bold text-indigo-900" value={parcelData.senderName} onChange={e => setParcelData({...parcelData, senderName: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-indigo-400 uppercase ml-2">Telefone de Contato</label>
                    <input className="w-full bg-indigo-50/30 border-0 rounded-2xl p-5 font-bold text-indigo-900" value={parcelData.senderPhone} onChange={e => setParcelData({...parcelData, senderPhone: e.target.value})} />
                 </div>
              </div>
              <div className="bg-indigo-50/50 p-6 rounded-3xl">
                 <p className="text-[9px] font-black text-indigo-400 uppercase mb-4">O que será entregue?</p>
                 <textarea 
                    className="w-full bg-white border-0 rounded-2xl p-4 font-bold text-indigo-900 min-h-[100px]" 
                    placeholder="Ex: Documentos, Chaves, Caixa de presentes..." 
                    value={parcelData.description}
                    onChange={e => setParcelData({...parcelData, description: e.target.value})}
                 />
              </div>
           </div>

           <div className="bg-indigo-950 text-white p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl space-y-6">
              <div>
                 <h3 className="text-2xl font-black uppercase tracking-tighter">Dados de Entrega</h3>
                 <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Quem irá receber o objeto</p>
              </div>
              <div className="space-y-4">
                 <input className="w-full bg-white/10 border-2 border-white/10 rounded-2xl p-5 font-bold text-white placeholder:text-white/20" placeholder="Nome do Destinatário" value={parcelData.recipientName} onChange={e => setParcelData({...parcelData, recipientName: e.target.value})} />
                 <input className="w-full bg-white/10 border-2 border-white/10 rounded-2xl p-5 font-bold text-white placeholder:text-white/20" placeholder="Telefone de quem recebe" value={parcelData.recipientPhone} onChange={e => setParcelData({...parcelData, recipientPhone: e.target.value})} />
                 <input className="w-full bg-white/10 border-2 border-white/10 rounded-2xl p-5 font-bold text-white placeholder:text-white/20" placeholder="Endereço Completo de Entrega" value={parcelData.address} onChange={e => setParcelData({...parcelData, address: e.target.value})} />
              </div>
              <div className="pt-8 space-y-4 border-t border-white/10">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-indigo-400 uppercase">Custo do Envio</span>
                    <span className="text-2xl font-black text-green-400">R$ {Math.max(paymentSettings.pricing.minFare, 18.00).toFixed(2)}</span>
                 </div>
                 <button onClick={handleConfirmParcel} className="w-full bg-green-600 text-white py-5 rounded-[2rem] font-black uppercase text-xs shadow-xl hover:bg-green-500 transition-all">Chamar Entregador</button>
                 <button onClick={() => setViewMode('HOME')} className="w-full text-indigo-400 font-black text-[9px] uppercase tracking-widest">Voltar</button>
              </div>
           </div>
        </div>
      )}

      {viewMode === 'WALLET' && (
        <div className="max-w-4xl mx-auto space-y-10 animate-in zoom-in duration-300">
           
           {/* Resgate de Código */}
           <div className="bg-indigo-950 text-white p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl space-y-6">
              <div className="text-center">
                 <h2 className="text-2xl font-black uppercase tracking-tighter">Ativar Código de Recarga</h2>
                 <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-1">Insira o código recebido após a compra externa</p>
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                 <input 
                    className="flex-1 bg-white/10 border-2 border-white/20 rounded-2xl p-5 font-black text-center text-xl uppercase tracking-[0.2em] outline-none focus:border-green-500 transition-all placeholder:text-white/20" 
                    placeholder="DIGITE O CÓDIGO AQUI" 
                    value={activationCodeInput}
                    onChange={e => setActivationCodeInput(e.target.value)}
                 />
                 <button 
                    onClick={handleRedeem}
                    disabled={isRedeeming}
                    className={`bg-green-600 text-white px-10 py-5 rounded-2xl font-black uppercase text-xs shadow-lg transition-all ${isRedeeming ? 'opacity-50' : 'hover:bg-green-500 active:scale-95'}`}
                 >
                    {isRedeeming ? 'Validando...' : 'Ativar Saldo'}
                 </button>
              </div>
           </div>

           {/* Catálogo de Créditos (Compra Externa) */}
           <div className="space-y-6">
              <div className="text-center">
                 <h3 className="text-2xl font-black text-indigo-950 uppercase">Catálogo de Créditos Duarte</h3>
                 <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Escolha um pacote para ser redirecionado ao site de vendas</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {(paymentSettings.pricing.topUpProducts || []).map(product => (
                    <div key={product.id} className="bg-white p-10 rounded-[3.5rem] border-2 border-indigo-50 shadow-sm hover:border-indigo-600 transition-all text-center space-y-4 group">
                       <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto font-black text-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">R$</div>
                       <h4 className="text-lg font-black text-indigo-950 uppercase tracking-tight">{product.name}</h4>
                       <p className="text-4xl font-black text-green-600 tracking-tighter">R$ {product.amount.toFixed(2)}</p>
                       <p className="text-[9px] text-indigo-300 font-bold uppercase tracking-widest leading-relaxed">Pague no site externo e receba o código de ativação</p>
                       <button 
                          onClick={() => handleBuyCredits(product)} 
                          className="w-full bg-indigo-950 text-white py-5 rounded-2xl font-black uppercase text-[10px] shadow-lg hover:bg-black transition-all"
                       >
                          Compras
                       </button>
                    </div>
                 ))}
                 {(paymentSettings.pricing.topUpProducts || []).length === 0 && (
                    <div className="md:col-span-3 py-10 text-center text-indigo-300 font-black uppercase text-xs">Nenhum pacote disponível no momento</div>
                 )}
              </div>
           </div>

           <button onClick={() => setViewMode('HOME')} className="w-full text-indigo-300 font-black text-[10px] uppercase tracking-widest hover:text-indigo-600 transition-colors">← Voltar ao Início</button>
        </div>
      )}
    </div>
  );
};

export default UserView;

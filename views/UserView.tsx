
import React, { useState, useEffect, useRef } from 'react';
import { Shop, MenuItem, Order, OrderStatus, ServiceType, PaymentMethod } from '../types';
import { MOCK_SHOPS } from '../constants';
import { CartIcon, TrashIcon, StoreIcon, TruckIcon, UserIcon, MapPinIcon } from '../components/Icons';
import { geminiService } from '../services/geminiService';

interface CartItem extends MenuItem {
  quantity: number;
}

interface UserViewProps {
  onPlaceOrder: (data: any, type: ServiceType, payment: PaymentMethod) => void;
  onRateOrder: (orderId: string, merchantRating?: number, driverRating?: number) => void;
  allOrders: Order[];
}

const UserView: React.FC<UserViewProps> = ({ onPlaceOrder, onRateOrder, allOrders }) => {
  const [viewMode, setViewMode] = useState<'HOME' | 'FOOD' | 'PARCEL' | 'RIDE' | 'HISTORY' | 'CHECKOUT'>('HOME');
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>(PaymentMethod.PIX);
  
  // Location State
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [nearbyInfo, setNearbyInfo] = useState<{text: string, links: any[]}>({ text: '', links: [] });

  // AI Discovery State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<{text: string, links: any[]} | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Forms
  const [parcelInfo, setParcelInfo] = useState({ description: '', weight: '', destination: '' });
  const [rideInfo, setRideInfo] = useState({ origin: '', destination: '' });
  const [checkoutData, setCheckoutData] = useState<{data: any, type: ServiceType} | null>(null);

  const detectLocation = () => {
    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(newCoords);
        setIsDetecting(false);
      },
      () => {
        setIsDetecting(false);
        alert("Ative o GPS para melhor experiência.");
      }
    );
  };

  useEffect(() => {
    if (coords) geminiService.getNearbyRecommendations(coords.lat, coords.lng).then(setNearbyInfo);
  }, [coords]);

  const handleGlobalSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const res = await geminiService.searchInformation(searchQuery);
    setSearchResult(res);
    setIsSearching(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsAnalyzing(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const res = await geminiService.analyzeImage(base64, file.type, "Analise este prato/produto e me diga o que é e qual o valor aproximado no mercado.");
      setAnalysisResult(res || "Não foi possível analisar.");
      setIsAnalyzing(false);
    };
    reader.readAsDataURL(file);
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const handleCheckoutInit = (data: any, type: ServiceType) => {
    setCheckoutData({ data, type });
    setViewMode('CHECKOUT');
  };

  const confirmOrder = () => {
    if (checkoutData) {
      onPlaceOrder(checkoutData.data, checkoutData.type, selectedPayment);
      setCart([]);
      setSelectedShop(null);
      setCheckoutData(null);
      setViewMode('HOME');
    }
  };

  const renderHome = () => (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Banner de Impacto */}
      <section className="relative h-64 md:h-80 rounded-[3rem] overflow-hidden shadow-2xl group">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 via-indigo-800 to-transparent z-10"></div>
        <img 
          src="https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=1200" 
          alt="Delivery Motorcycle" 
          className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-1000"
        />
        <div className="relative z-20 h-full flex flex-col justify-center px-8 md:px-16 text-white max-w-2xl">
          <span className="bg-orange-500 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full w-fit mb-4">Express Delivery</span>
          <h1 className="text-4xl md:text-6xl font-black leading-tight mb-4 drop-shadow-lg">
            Sua cidade, <br/>
            <span className="text-orange-400">em minutos.</span>
          </h1>
          <p className="text-indigo-100 text-sm md:text-base opacity-90 max-w-md hidden md:block">
            Pedir comida, enviar encomendas ou solicitar uma viagem nunca foi tão rápido e inteligente. Experimente a revolução Delivora.
          </p>
          <div className="mt-6 flex gap-4">
            <button onClick={() => setViewMode('FOOD')} className="bg-white text-indigo-900 px-6 py-2 rounded-xl font-bold text-sm shadow-xl hover:bg-orange-400 hover:text-white transition-all">Pedir Agora</button>
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-200">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              2,450 motoristas ativos
            </div>
          </div>
        </div>
        {/* Elemento Decorativo Flutuante */}
        <div className="absolute bottom-6 right-6 z-20 hidden md:block animate-bounce duration-[3s]">
           <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                 <TruckIcon />
              </div>
              <div className="text-white">
                 <p className="text-[10px] font-bold opacity-60">Status Médio</p>
                 <p className="text-xs font-black">Entrega em 12 min</p>
              </div>
           </div>
        </div>
      </section>

      <section className="text-center pt-4">
        <h2 className="text-3xl font-black text-gray-900 mb-2">O que você precisa hoje?</h2>
        
        {/* Barra de Busca AI */}
        <div className="mt-8 max-w-xl mx-auto relative group">
          <input 
            type="text" 
            placeholder="Procure algo novo... 'Melhores hambúrgueres SP'" 
            className="w-full bg-white border border-gray-100 shadow-xl shadow-indigo-100/20 rounded-[2rem] px-8 py-4 focus:ring-4 focus:ring-indigo-500/10 transition-all pr-16"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleGlobalSearch()}
          />
          <button 
            onClick={handleGlobalSearch}
            className="absolute right-2 top-2 bg-indigo-600 text-white p-3 rounded-full hover:scale-105 transition-transform"
          >
            {isSearching ? '...' : '🔍'}
          </button>
        </div>

        {searchResult && (
          <div className="mt-4 max-w-xl mx-auto bg-white p-6 rounded-3xl border shadow-sm text-left animate-in slide-in-from-top duration-300">
            <h4 className="text-xs font-bold text-indigo-600 mb-2 uppercase tracking-widest">Busca Delivora AI</h4>
            <p className="text-sm text-gray-700 leading-relaxed mb-4">{searchResult.text}</p>
            {searchResult.links.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {searchResult.links.map((l, i) => (
                  <a key={i} href={l.uri} target="_blank" rel="noreferrer" className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full hover:bg-indigo-100 transition-colors">
                    {l.title}
                  </a>
                ))}
              </div>
            )}
            <button onClick={() => setSearchResult(null)} className="mt-4 text-[10px] text-gray-400 font-bold hover:underline">Fechar resultado</button>
          </div>
        )}
      </section>

      {/* Discovery Hub */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nearby Maps Grounding */}
        <div className="bg-indigo-900 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
          <h3 className="text-xl font-black mb-4 flex items-center gap-2">
            <MapPinIcon /> Ao seu Redor
          </h3>
          {coords ? (
            <div className="space-y-4">
               <p className="text-sm text-indigo-100 opacity-80">{nearbyInfo.text}</p>
               <div className="flex flex-wrap gap-2">
                 {nearbyInfo.links.map((l, i) => (
                   <a key={i} href={l.uri} target="_blank" rel="noreferrer" className="text-[10px] font-bold bg-white/10 text-white px-3 py-1 rounded-full hover:bg-white/20">
                     {l.title}
                   </a>
                 ))}
               </div>
            </div>
          ) : (
            <button onClick={detectLocation} className="bg-white text-indigo-900 px-6 py-3 rounded-2xl font-bold text-sm shadow-xl hover:scale-105 transition-all">
              {isDetecting ? 'Localizando...' : 'Ativar Radar Delivora'}
            </button>
          )}
        </div>

        {/* Image Analysis Hub */}
        <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center space-y-4 relative group overflow-hidden">
           <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-3xl flex items-center justify-center group-hover:rotate-12 transition-transform">
             <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
           </div>
           <div>
             <h3 className="text-xl font-black">Scan Delivora</h3>
             <p className="text-xs text-gray-400 mt-1">Tire uma foto do seu prato e deixe a IA identificar.</p>
           </div>
           <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="bg-gray-900 text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-xl hover:bg-black transition-all"
           >
             {isAnalyzing ? 'Analisando...' : 'Fazer Upload'}
           </button>
           
           {analysisResult && (
             <div className="absolute inset-0 bg-white p-8 flex flex-col justify-center items-center animate-in fade-in duration-300">
               <h4 className="font-bold text-indigo-600 mb-2">Resultado da Análise</h4>
               <p className="text-xs text-gray-600 mb-4">{analysisResult}</p>
               <button onClick={() => setAnalysisResult(null)} className="text-[10px] font-bold text-gray-400">Limpar</button>
             </div>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button onClick={() => setViewMode('FOOD')} className="bg-white p-8 rounded-3xl border-2 border-transparent hover:border-orange-500 transition-all group flex flex-col items-center shadow-sm">
          <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-4"><StoreIcon /></div>
          <h3 className="text-lg font-bold">Restaurantes</h3>
        </button>
        <button onClick={() => setViewMode('PARCEL')} className="bg-white p-8 rounded-3xl border-2 border-transparent hover:border-blue-500 transition-all group flex flex-col items-center shadow-sm">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4"><TruckIcon /></div>
          <h3 className="text-lg font-bold">Encomendas</h3>
        </button>
        <button onClick={() => setViewMode('RIDE')} className="bg-white p-8 rounded-3xl border-2 border-transparent hover:border-green-500 transition-all group flex flex-col items-center shadow-sm">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-4"><UserIcon /></div>
          <h3 className="text-lg font-bold">Viagens</h3>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {viewMode === 'HOME' && renderHome()}
      {viewMode === 'FOOD' && (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
          <button onClick={() => setViewMode('HOME')} className="text-gray-400 text-sm font-bold flex items-center gap-2 hover:text-gray-900 transition-colors">
            <span className="text-lg">←</span> Voltar para Início
          </button>
          {!selectedShop ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {MOCK_SHOPS.map(shop => (
                <div key={shop.id} onClick={() => setSelectedShop(shop)} className="bg-white rounded-[2.5rem] border overflow-hidden shadow-sm cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1">
                  <img src={shop.image} className="w-full h-48 object-cover" />
                  <div className="p-6 flex justify-between items-center">
                    <div>
                      <h3 className="font-black text-xl text-gray-900">{shop.name}</h3>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{shop.category}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-orange-500 font-black text-lg">★ {shop.rating}</span>
                      <span className="text-[10px] text-gray-400">15-25 min</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[3rem] border p-8 space-y-8">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-4xl font-black text-gray-900">{selectedShop.name}</h2>
                  <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-xs mt-1">{selectedShop.category}</p>
                </div>
                <button onClick={() => setSelectedShop(null)} className="bg-gray-100 text-gray-500 px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors">Mudar Loja</button>
              </div>
              <div className="grid gap-6">
                {selectedShop.menu.map(item => (
                  <div key={item.id} className="group flex justify-between items-center p-6 bg-gray-50 rounded-[2rem] hover:bg-white hover:shadow-xl border border-transparent hover:border-gray-100 transition-all">
                    <div className="flex items-center gap-6">
                      <img src={item.image} className="w-20 h-20 object-cover rounded-2xl shadow-md" />
                      <div>
                        <h4 className="font-black text-lg text-gray-900">{item.name}</h4>
                        <p className="text-xs text-gray-400 max-w-xs">{item.description}</p>
                        <p className="mt-2 font-black text-indigo-600">R$ {item.price.toFixed(2)}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => addToCart(item)} 
                      className="w-12 h-12 bg-orange-500 text-white rounded-2xl font-black shadow-lg shadow-orange-100 hover:scale-110 active:scale-95 transition-all flex items-center justify-center text-xl"
                    >
                      +
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {cart.length > 0 && (
            <div className="fixed bottom-24 right-4 left-4 md:left-auto md:w-96 bg-gray-900 text-white p-6 rounded-[2.5rem] shadow-2xl border border-white/10 z-50 animate-in slide-in-from-bottom duration-500">
              <div className="flex justify-between items-center mb-4">
                 <div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Carrinho</p>
                   <p className="text-lg font-black">{cart.length} itens selecionados</p>
                 </div>
                 <div className="text-right">
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</p>
                   <p className="text-xl font-black text-orange-400">R$ {cart.reduce((a,b) => a + (b.price*b.quantity), 0).toFixed(2)}</p>
                 </div>
              </div>
              <button 
                onClick={() => handleCheckoutInit({ items: cart, shop: selectedShop }, ServiceType.FOOD)}
                className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-orange-600 transition-all flex items-center justify-center gap-3"
              >
                <span>Finalizar Pedido</span>
                <span className="text-lg">→</span>
              </button>
            </div>
          )}
        </div>
      )}
      {viewMode === 'CHECKOUT' && (
        <div className="max-w-md mx-auto animate-in zoom-in duration-300 space-y-8 pt-10">
          <header className="flex justify-between items-center">
            <button onClick={() => setViewMode('FOOD')} className="text-gray-400 font-bold text-sm hover:text-gray-900">← Alterar Carrinho</button>
            <h2 className="text-2xl font-black text-center">Checkout</h2>
            <div className="w-10"></div>
          </header>
          
          <div className="bg-white p-8 rounded-[3rem] border shadow-sm space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Forma de Pagamento</label>
              <div className="grid grid-cols-1 gap-3">
                {[PaymentMethod.PIX, PaymentMethod.CREDIT_CARD, PaymentMethod.CASH].map(method => (
                  <button 
                    key={method}
                    onClick={() => setSelectedPayment(method)}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${selectedPayment === method ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-gray-50 text-gray-500'}`}
                  >
                    <span className="font-bold">{method}</span>
                    {selectedPayment === method && <span className="text-lg">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-3xl space-y-3">
               <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="font-bold">R$ {checkoutData?.data.items.reduce((a:any,b:any) => a + (b.price*b.quantity), 0).toFixed(2)}</span>
               </div>
               <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Taxa de Entrega</span>
                  <span className="font-bold text-green-600">Grátis</span>
               </div>
               <div className="pt-3 border-t flex justify-between">
                  <span className="font-black">Total a Pagar</span>
                  <span className="font-black text-indigo-600 text-xl">R$ {checkoutData?.data.items.reduce((a:any,b:any) => a + (b.price*b.quantity), 0).toFixed(2)}</span>
               </div>
            </div>

            <button 
              onClick={confirmOrder} 
              className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black text-lg shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
            >
              Confirmar Pagamento
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserView;


import React, { useState, useEffect, useMemo } from 'react';
import { Order, OrderStatus, ServiceType, Location, PaymentMethod, ApiSettings } from '../types';
import { TruckIcon, UserIcon, StoreIcon, MapPinIcon } from '../components/Icons';
import { geminiService } from '../services/geminiService';
import MapView from '../components/MapView';

interface DriverViewProps {
  orders: Order[];
  currentDriverId: string;
  paymentSettings: ApiSettings;
  onAcceptOrder: (orderId: string) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}

interface RouteStop {
  orderId: string;
  type: 'PICKUP' | 'DROPOFF';
  label: string;
  subLabel: string;
  location: Location;
  distanceFromPrev: number;
  serviceType: ServiceType;
}

const DriverView: React.FC<DriverViewProps> = ({ orders, currentDriverId, paymentSettings, onAcceptOrder, onUpdateStatus }) => {
  const [driverCoords, setDriverCoords] = useState<Location | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState<RouteStop[]>([]);
  const [routeBriefing, setRouteBriefing] = useState<string>('');

  const requestLocation = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDriverCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true }
    );
  };

  const calculateDistance = (loc1: Location, loc2: Location) => {
    const R = 6371;
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLon = (loc2.lng - loc1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const stats = useMemo(() => {
    const myHistory = orders.filter(o => o.driverId === currentDriverId && (o.status === OrderStatus.DELIVERED || o.status === OrderStatus.COMPLETED));
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const lastWeek = now.getTime() - (7 * 24 * 60 * 60 * 1000);
    const lastMonth = now.getTime() - (30 * 24 * 60 * 60 * 1000);
    const commission = paymentSettings.commissionRate / 100;

    const calculate = (filtered: Order[]) => {
      const gross = filtered.reduce((acc, o) => acc + o.total, 0);
      return { count: filtered.length, revenue: gross, liquid: gross * (1 - commission) };
    };

    return {
      day: calculate(myHistory.filter(o => new Date(o.createdAt).getTime() >= today)),
      week: calculate(myHistory.filter(o => new Date(o.createdAt).getTime() >= lastWeek)),
      month: calculate(myHistory.filter(o => new Date(o.createdAt).getTime() >= lastMonth))
    };
  }, [orders, currentDriverId, paymentSettings.commissionRate]);

  const optimizeRoute = async () => {
    if (!driverCoords) return;
    const myCurrentOrders = orders.filter(o => o.driverId === currentDriverId && ![OrderStatus.COMPLETED, OrderStatus.DELIVERED, OrderStatus.CANCELLED].includes(o.status));
    if (myCurrentOrders.length === 0) { setOptimizedRoute([]); return; }

    let stops: RouteStop[] = [];
    myCurrentOrders.forEach(o => {
      if ([OrderStatus.READY, OrderStatus.PENDING, OrderStatus.PREPARING].includes(o.status)) {
        const isRide = o.type === ServiceType.RIDE;
        stops.push({ 
          orderId: o.id, type: 'PICKUP', 
          label: isRide ? `Passageiro: ${o.userName}` : `Coleta: ${o.shopName || 'Loja'}`,
          subLabel: isRide ? "Origem da Viagem" : "Retirada de Pedido",
          location: o.location || driverCoords, distanceFromPrev: 0, serviceType: o.type
        });
      }
      if ([OrderStatus.OUT_FOR_DELIVERY, OrderStatus.IN_TRANSIT].includes(o.status)) {
        const isRide = o.type === ServiceType.RIDE;
        stops.push({ 
          orderId: o.id, type: 'DROPOFF', 
          label: isRide ? `Destino de ${o.userName}` : `Entrega: ${o.userName}`,
          subLabel: isRide ? "Final da Viagem" : (o.parcelDetails?.destination || "Endereço do Cliente"),
          location: o.destinationLocation || o.location || driverCoords, distanceFromPrev: 0, serviceType: o.type
        });
      }
    });

    if (stops.length === 0) { setOptimizedRoute([]); return; }

    let finalRoute: RouteStop[] = [];
    let currentPos = driverCoords;
    let remainingStops = [...stops];
    while (remainingStops.length > 0) {
      let nearestIdx = 0;
      let minDistance = calculateDistance(currentPos, remainingStops[0].location);
      for (let i = 1; i < remainingStops.length; i++) {
        const dist = calculateDistance(currentPos, remainingStops[i].location);
        if (dist < minDistance) { minDistance = dist; nearestIdx = i; }
      }
      const nextStop = remainingStops.splice(nearestIdx, 1)[0];
      nextStop.distanceFromPrev = minDistance;
      finalRoute.push(nextStop);
      currentPos = nextStop.location;
    }
    setOptimizedRoute(finalRoute);
    const briefing = await geminiService.getRouteBriefing(finalRoute.map(s => s.label));
    setRouteBriefing(briefing);
  };

  useEffect(() => { optimizeRoute(); }, [driverCoords, orders, currentDriverId]);

  const availableOrders = orders
    .filter(o => (o.status === OrderStatus.READY || o.status === OrderStatus.PENDING) && !o.driverId)
    .map(order => ({ ...order, distance: driverCoords && order.location ? calculateDistance(driverCoords, order.location) : null }))
    .sort((a, b) => {
        if (a.status === OrderStatus.READY && b.status !== OrderStatus.READY) return -1;
        if (b.status === OrderStatus.READY && a.status !== OrderStatus.READY) return 1;
        return (a.distance || 999) - (b.distance || 999);
    });

  const activeCalls = availableOrders.filter(o => o.status === OrderStatus.READY);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <header className="bg-white p-6 rounded-3xl shadow-sm border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-indigo-950 tracking-tight">Logística Duarte</h1>
          <p className="text-indigo-400 font-bold text-xs uppercase tracking-widest mt-1">Status: {driverCoords ? 'GPS Online' : 'Localizando...'}</p>
        </div>
        <button onClick={requestLocation} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${driverCoords ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700'}`}>
          <MapPinIcon /> {isLocating ? 'Sincronizando...' : driverCoords ? 'Radar Ativo' : 'Ativar Radar'}
        </button>
      </header>

      {activeCalls.length > 0 && (
        <div className="bg-orange-500 p-4 rounded-2xl shadow-lg animate-pulse flex items-center justify-between border border-orange-400 text-white">
           <div className="flex items-center gap-3">
              <span className="text-2xl">🔔</span>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-orange-100">Chamada Prioritária</p>
                 <p className="text-sm font-bold">{activeCalls.length} {activeCalls.length === 1 ? 'coleta aguardando' : 'coletas aguardando'} retirada imediata!</p>
              </div>
           </div>
           <div className="bg-white/20 px-3 py-1 rounded-lg text-[10px] font-black">URGENTE</div>
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { id: 'day', label: 'Hoje', data: stats.day, color: 'from-indigo-600 to-indigo-800' },
          { id: 'week', label: 'Semana', data: stats.week, color: 'from-blue-600 to-blue-800' },
          { id: 'month', label: 'Mês', data: stats.month, color: 'from-slate-800 to-black' }
        ].map(card => (
          <div key={card.id} className={`bg-gradient-to-br ${card.color} p-6 rounded-[2.5rem] shadow-xl text-white space-y-4`}>
            <div className="flex justify-between items-center opacity-80">
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">{card.label}</span>
              <span className="text-[10px] bg-white/20 px-2 py-1 rounded-lg font-bold">{card.data.count} Entregas</span>
            </div>
            <div>
               <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Líquido a Receber</p>
               <h3 className="text-3xl font-black">R$ {card.data.liquid.toFixed(2)}</h3>
               <p className="text-[9px] font-medium opacity-40 mt-1">Ganhos Brutos: R$ {card.data.revenue.toFixed(2)}</p>
            </div>
          </div>
        ))}
      </section>

      {optimizedRoute.length > 0 && (
        <section className="bg-white p-6 rounded-[3rem] shadow-xl border border-indigo-50 space-y-6">
          <div className="flex justify-between items-center">
            <div>
               <h3 className="text-xl font-black text-indigo-950">Rota Dinâmica</h3>
               <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest">Trajeto mais rápido via IA</p>
            </div>
          </div>
          <div className="h-[350px] w-full bg-indigo-50 rounded-[2.5rem] overflow-hidden border border-indigo-100">
            <MapView showRouteLine={true} markers={[
              ...(driverCoords ? [{ position: driverCoords, label: "Você", type: 'DRIVER' as const }] : []),
              ...optimizedRoute.map(stop => ({ position: stop.location, label: stop.label, type: stop.type === 'PICKUP' ? 'SHOP' as const : 'USER' as const }))
            ]} />
          </div>
          <div className="space-y-3">
            {optimizedRoute.map((stop, idx) => {
              const order = orders.find(o => o.id === stop.orderId);
              const isActive = idx === 0;
              return (
                <div key={`${stop.orderId}-${idx}`} className={`p-5 rounded-[2rem] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all border ${isActive ? 'bg-indigo-950 text-white border-transparent shadow-2xl scale-[1.02]' : 'bg-indigo-50/30 text-indigo-300 border-indigo-50/50 grayscale'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl ${isActive ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-200 border'}`}>{idx + 1}</div>
                    <div>
                       <h4 className="font-black text-lg">{stop.label}</h4>
                       <p className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-indigo-400' : 'text-indigo-200'}`}>{stop.subLabel}</p>
                    </div>
                  </div>
                  {isActive && (
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button onClick={() => { if (order) onUpdateStatus(order.id, stop.type === 'PICKUP' ? (order.type === ServiceType.RIDE ? OrderStatus.IN_TRANSIT : OrderStatus.OUT_FOR_DELIVERY) : OrderStatus.DELIVERED); }} className="flex-1 sm:flex-none bg-white text-indigo-950 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-50 transition-all">
                        {stop.type === 'PICKUP' ? 'Confirmar Coleta' : 'Confirmar Entrega'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-xs font-black text-indigo-300 uppercase tracking-[0.2em] px-2">Serviços no Radar</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableOrders.map(order => (
            <div key={order.id} className={`p-6 rounded-[2.5rem] border transition-all flex justify-between items-center group ${order.status === OrderStatus.READY ? 'bg-orange-50 border-orange-200 shadow-orange-50' : 'bg-white border-indigo-50'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${order.status === OrderStatus.READY ? 'bg-orange-500 text-white animate-pulse' : 'bg-indigo-100 text-indigo-600'}`}>
                  {order.type === ServiceType.FOOD ? <StoreIcon /> : <UserIcon />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-indigo-950">{order.shopName || "Pedido"}</h4>
                    {order.id.startsWith('MAN') && <span className="text-[8px] bg-indigo-900 text-white px-2 py-0.5 rounded font-black uppercase tracking-tighter">ENTREGA DIRETA</span>}
                    {order.status === OrderStatus.READY && !order.id.startsWith('MAN') && <span className="text-[8px] bg-orange-600 text-white px-2 py-0.5 rounded font-black uppercase tracking-tighter">COLETA</span>}
                  </div>
                  <p className="text-xs font-bold text-indigo-400">R$ {order.total.toFixed(2)} • {order.distance?.toFixed(1) || '0.0'} km</p>
                  {order.parcelDetails?.destination && (
                    <p className="text-[10px] font-bold text-indigo-300 mt-1">Destino: {order.parcelDetails.destination}</p>
                  )}
                </div>
              </div>
              <button onClick={() => onAcceptOrder(order.id)} className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${order.status === OrderStatus.READY ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>Aceitar</button>
            </div>
          ))}
          {availableOrders.length === 0 && (
            <div className="md:col-span-2 p-12 bg-white rounded-[3rem] border border-dashed border-indigo-100 text-center text-indigo-200 font-bold uppercase tracking-widest text-xs">Aguardando novos sinais...</div>
          )}
        </div>
      </section>
    </div>
  );
};

export default DriverView;

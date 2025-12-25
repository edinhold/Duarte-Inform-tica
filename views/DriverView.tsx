
import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, ServiceType, Location } from '../types';
import { TruckIcon, UserIcon, StoreIcon, MapPinIcon } from '../components/Icons';
import { geminiService } from '../services/geminiService';

interface DriverViewProps {
  orders: Order[];
  onAcceptOrder: (orderId: string) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}

interface RouteStop {
  orderId: string;
  type: 'PICKUP' | 'DROPOFF';
  label: string;
  location: Location;
  distanceFromPrev: number;
}

const DriverView: React.FC<DriverViewProps> = ({ orders, onAcceptOrder, onUpdateStatus }) => {
  const [driverCoords, setDriverCoords] = useState<Location | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [optimizedRoute, setOptimizedRoute] = useState<RouteStop[]>([]);
  const [routeBriefing, setRouteBriefing] = useState<string>('');

  const requestLocation = () => {
    setIsLocating(true);
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError("Geolocalização não suportada.");
      setIsLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDriverCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setIsLocating(false);
      },
      (error) => {
        setLocationError("Erro ao acessar GPS. Verifique as permissões.");
        setIsLocating(false);
      },
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

  const optimizeRoute = async () => {
    if (!driverCoords) {
      alert("Ative seu GPS primeiro para otimizar a rota.");
      return;
    }

    const myCurrentOrders = orders.filter(o => o.driverId === 'driver-1' && ![OrderStatus.COMPLETED, OrderStatus.DELIVERED, OrderStatus.CANCELLED].includes(o.status));
    if (myCurrentOrders.length === 0) return;

    let stops: RouteStop[] = [];
    myCurrentOrders.forEach(o => {
      // Se precisa coletar
      if ([OrderStatus.READY, OrderStatus.PENDING, OrderStatus.PREPARING].includes(o.status)) {
        stops.push({ 
          orderId: o.id, 
          type: 'PICKUP', 
          label: `Coleta: ${o.shopName || 'Ponto de Partida'}`, 
          location: o.location || driverCoords,
          distanceFromPrev: 0
        });
      }
      // Se já coletou e precisa entregar
      if ([OrderStatus.OUT_FOR_DELIVERY, OrderStatus.IN_TRANSIT].includes(o.status)) {
        stops.push({ 
          orderId: o.id, 
          type: 'DROPOFF', 
          label: `Entrega: ${o.type === ServiceType.RIDE ? 'Destino Passageiro' : o.userName}`, 
          location: o.destinationLocation || o.location || driverCoords,
          distanceFromPrev: 0
        });
      }
    });

    // Heurística Nearest Neighbor
    let finalRoute: RouteStop[] = [];
    let currentPos = driverCoords;
    let remainingStops = [...stops];

    while (remainingStops.length > 0) {
      let nearestIdx = 0;
      let minDistance = calculateDistance(currentPos, remainingStops[0].location);

      for (let i = 1; i < remainingStops.length; i++) {
        const dist = calculateDistance(currentPos, remainingStops[i].location);
        if (dist < minDistance) {
          minDistance = dist;
          nearestIdx = i;
        }
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

  useEffect(() => {
    if (driverCoords) optimizeRoute();
  }, [driverCoords, orders.length]);

  const availableOrders = orders
    .filter(o => (o.status === OrderStatus.READY || o.status === OrderStatus.PENDING) && !o.driverId)
    .map(order => ({ ...order, distance: driverCoords && order.location ? calculateDistance(driverCoords, order.location) : null }))
    .sort((a, b) => (a.distance || 999) - (b.distance || 999));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="bg-white p-6 rounded-3xl shadow-sm border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Central do Motorista</h1>
          <p className="text-gray-500">Logística Inteligente Delivora.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={requestLocation} className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all ${driverCoords ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
            <MapPinIcon /> {isLocating ? 'GPS...' : driverCoords ? 'Online' : 'Ativar GPS'}
          </button>
        </div>
      </header>

      {/* Rota Otimizada */}
      {optimizedRoute.length > 0 && (
        <section className="bg-gray-900 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-1">Rota Otimizada por IA</h2>
                <h3 className="text-xl font-bold">Sequência de Trabalho</h3>
              </div>
              <button onClick={optimizeRoute} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">🔄</button>
            </div>

            {routeBriefing && (
              <p className="text-sm italic text-indigo-200 mb-6 pb-6 border-b border-white/10">"{routeBriefing}"</p>
            )}

            <div className="space-y-6">
              {optimizedRoute.map((stop, idx) => (
                <div key={`${stop.orderId}-${idx}`} className="flex gap-4 group">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shadow-lg ${idx === 0 ? 'bg-indigo-500 text-white animate-pulse' : 'bg-white/10 text-gray-400'}`}>
                      {idx + 1}
                    </div>
                    {idx < optimizedRoute.length - 1 && <div className="w-0.5 h-12 bg-white/5 my-1"></div>}
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex justify-between">
                      <h4 className={`font-bold ${idx === 0 ? 'text-white' : 'text-gray-400'}`}>{stop.label}</h4>
                      <span className="text-[10px] text-gray-500 uppercase font-bold">{stop.distanceFromPrev.toFixed(1)} km</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Ref: #{stop.orderId}</p>
                    {idx === 0 && (
                      <button 
                        onClick={() => {
                          const order = orders.find(o => o.id === stop.orderId);
                          if (!order) return;
                          if (stop.type === 'PICKUP') {
                            onUpdateStatus(order.id, order.type === ServiceType.RIDE ? OrderStatus.IN_TRANSIT : OrderStatus.OUT_FOR_DELIVERY);
                          } else {
                            onUpdateStatus(order.id, OrderStatus.COMPLETED);
                          }
                        }}
                        className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
                      >
                        {stop.type === 'PICKUP' ? 'Concluir Coleta' : 'Concluir Entrega'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Serviços Disponíveis */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Serviços Próximos</h2>
        <div className="grid gap-4">
          {availableOrders.length === 0 ? (
            <div className="p-12 text-center text-gray-400 border-2 border-dashed rounded-3xl">Nenhum serviço pendente na área.</div>
          ) : (
            availableOrders.map(order => (
              <div key={order.id} className="bg-white p-5 rounded-3xl shadow-sm border hover:shadow-md flex justify-between items-center group">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${order.type === ServiceType.FOOD ? 'bg-orange-50 text-orange-500' : order.type === ServiceType.PARCEL ? 'bg-blue-50 text-blue-500' : 'bg-green-50 text-green-500'}`}>
                    {order.type === ServiceType.FOOD ? <StoreIcon /> : order.type === ServiceType.PARCEL ? <TruckIcon /> : <UserIcon />}
                  </div>
                  <div>
                    <h4 className="font-bold">{order.shopName || order.parcelDetails?.description || 'Viagem'}</h4>
                    <p className="text-xs text-gray-400">R$ {order.total.toFixed(2)} {order.distance !== null && `• ${order.distance.toFixed(1)} km`}</p>
                  </div>
                </div>
                <button onClick={() => onAcceptOrder(order.id)} className="bg-gray-900 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-black transition-all">Aceitar</button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default DriverView;

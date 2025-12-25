
import React, { useEffect, useState } from 'react';
import { Order, OrderStatus } from '../types';
import { geminiService } from '../services/geminiService';

interface MerchantViewProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}

const MerchantView: React.FC<MerchantViewProps> = ({ orders, onUpdateStatus }) => {
  const [aiTip, setAiTip] = useState<string>('Carregando insight estratégico...');

  const ratedOrders = orders.filter(o => o.merchantRating !== undefined);
  const avgRating = ratedOrders.length > 0 
    ? (ratedOrders.reduce((acc, o) => acc + (o.merchantRating || 0), 0) / ratedOrders.length).toFixed(1)
    : 'N/A';

  useEffect(() => {
    const fetchTip = async () => {
      const tip = await geminiService.getMerchantStrategy(orders.length, ratedOrders.map(o => o.merchantRating || 5));
      setAiTip(tip || '');
    };
    fetchTip();
  }, [orders.length]);

  const activeOrders = orders.filter(o => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED);

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold">Painel do Logista</h1>
          <p className="text-gray-500">Gerencie seus pedidos e cardápio.</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Avaliação Média</p>
          <span className="flex items-center justify-end gap-1 font-bold text-yellow-500 text-lg">
            ★ {avgRating}
          </span>
        </div>
      </header>

      <div className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg flex items-start gap-3">
        <div className="bg-white/20 p-2 rounded-lg">✨</div>
        <div>
          <h3 className="font-bold text-sm uppercase opacity-80">Insight Inteligente</h3>
          <p className="text-lg italic">{aiTip}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            Pedidos Ativos <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded text-sm">{activeOrders.length}</span>
          </h2>
          {activeOrders.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border-2 border-dashed border-gray-200 text-center text-gray-400">
              Nenhum pedido ativo no momento.
            </div>
          ) : (
            <div className="grid gap-4">
              {activeOrders.map(order => (
                <div key={order.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900">#{order.id}</span>
                      <span className="text-gray-400">• {order.userName}</span>
                    </div>
                    <ul className="text-sm text-gray-500 space-y-1">
                      {order.items?.map((item, idx) => (
                        <li key={idx}>{item.quantity}x {item.name}</li>
                      ))}
                    </ul>
                    <p className="mt-2 font-bold text-orange-600">Total: R$ {order.total.toFixed(2)}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {order.status === OrderStatus.PENDING && (
                      <button 
                        onClick={() => onUpdateStatus(order.id, OrderStatus.PREPARING)}
                        className="bg-orange-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-600"
                      >
                        Aceitar e Preparar
                      </button>
                    )}
                    {order.status === OrderStatus.PREPARING && (
                      <button 
                        onClick={() => onUpdateStatus(order.id, OrderStatus.READY)}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-600"
                      >
                        Pedido Pronto
                      </button>
                    )}
                    <span className="text-center text-xs text-gray-400 uppercase tracking-widest font-bold">
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold">Feedback Recente</h2>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            {ratedOrders.slice(0, 3).map(o => (
              <div key={o.id} className="border-b pb-3 last:border-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-gray-400">Pedido #{o.id}</span>
                  <span className="text-yellow-500 text-sm">{'★'.repeat(o.merchantRating || 0)}</span>
                </div>
                <p className="text-xs italic text-gray-500">Avaliado em {new Date(o.ratedAt || '').toLocaleDateString()}</p>
              </div>
            ))}
            {ratedOrders.length === 0 && <p className="text-xs text-gray-400 italic">Nenhuma avaliação ainda.</p>}
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-400 text-sm">Faturamento Hoje</p>
            <p className="text-3xl font-bold">R$ {orders.reduce((acc, o) => acc + o.total, 0).toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantView;

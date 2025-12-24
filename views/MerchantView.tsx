
import React, { useEffect, useState } from 'react';
import { Order, OrderStatus } from '../types';
import { geminiService } from '../services/geminiService';

interface MerchantViewProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}

const MerchantView: React.FC<MerchantViewProps> = ({ orders, onUpdateStatus }) => {
  const [aiTip, setAiTip] = useState<string>('Carregando insight estratégico...');

  useEffect(() => {
    const fetchTip = async () => {
      const tip = await geminiService.getMerchantStrategy(orders.length, [4.5, 5, 4.8]);
      setAiTip(tip || '');
    };
    fetchTip();
  }, [orders.length]);

  const activeOrders = orders.filter(o => o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED);

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold">Painel do Logista</h1>
          <p className="text-gray-500">Gerencie seus pedidos e cardápio.</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">Status da Loja</p>
          <span className="flex items-center gap-2 font-semibold text-green-500">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Aberta
          </span>
        </div>
      </header>

      {/* AI Recommendation */}
      <div className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg flex items-start gap-3">
        <div className="bg-white/20 p-2 rounded-lg">✨</div>
        <div>
          <h3 className="font-bold text-sm uppercase opacity-80">Insight Inteligente</h3>
          <p className="text-lg italic">{aiTip}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders Column */}
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
                      {order.items.map((item, idx) => (
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
                      Status: {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Resumo Hoje</h2>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            <div>
              <p className="text-gray-400 text-sm">Faturamento</p>
              <p className="text-3xl font-bold">R$ {orders.filter(o => o.status !== OrderStatus.CANCELLED).reduce((acc, o) => acc + o.total, 0).toFixed(2)}</p>
            </div>
            <div className="h-px bg-gray-100 w-full"></div>
            <div>
              <p className="text-gray-400 text-sm">Total Pedidos</p>
              <p className="text-3xl font-bold text-indigo-600">{orders.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantView;

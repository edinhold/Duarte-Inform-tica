
import React from 'react';
import { Order, OrderStatus } from '../types';

interface DriverViewProps {
  orders: Order[];
  onAcceptOrder: (orderId: string) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}

const DriverView: React.FC<DriverViewProps> = ({ orders, onAcceptOrder, onUpdateStatus }) => {
  const availableOrders = orders.filter(o => o.status === OrderStatus.READY && !o.driverId);
  const myCurrentOrders = orders.filter(o => o.driverId === 'driver-1' && o.status !== OrderStatus.DELIVERED);

  return (
    <div className="space-y-6">
      <header className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Painel do Entregador</h1>
          <p className="text-gray-500">Encontre rotas e realize entregas.</p>
        </div>
        <div className="text-right">
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">Disponível</span>
        </div>
      </header>

      {/* Ongoing Deliveries */}
      {myCurrentOrders.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-orange-600">Sua Entrega Atual</h2>
          {myCurrentOrders.map(order => (
            <div key={order.id} className="bg-white p-6 rounded-2xl shadow-md border-2 border-orange-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold">{order.shopName}</h3>
                  <p className="text-gray-500">Destino: {order.userName}</p>
                </div>
                <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase">
                  {order.status === OrderStatus.READY ? 'A caminho da loja' : 'Com você'}
                </span>
              </div>
              <div className="flex gap-3">
                {order.status === OrderStatus.READY && (
                  <button 
                    onClick={() => onUpdateStatus(order.id, OrderStatus.OUT_FOR_DELIVERY)}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700"
                  >
                    Coletar Pedido
                  </button>
                )}
                {order.status === OrderStatus.OUT_FOR_DELIVERY && (
                  <button 
                    onClick={() => onUpdateStatus(order.id, OrderStatus.DELIVERED)}
                    className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700"
                  >
                    Confirmar Entrega
                  </button>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Available Orders Pool */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold">Pedidos Disponíveis</h2>
        {availableOrders.length === 0 ? (
          <div className="bg-gray-100 p-8 rounded-2xl text-center text-gray-500">
            Aguardando novos pedidos prontos para coleta...
          </div>
        ) : (
          <div className="grid gap-4">
            {availableOrders.map(order => (
              <div key={order.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-lg">{order.shopName}</h4>
                  <p className="text-gray-500 text-sm">{order.items.length} itens • R$ {order.total.toFixed(2)}</p>
                </div>
                <button 
                  onClick={() => onAcceptOrder(order.id)}
                  className="bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors"
                >
                  Aceitar Rota
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default DriverView;

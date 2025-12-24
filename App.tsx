
import React, { useState, useEffect } from 'react';
import { UserRole, Order, OrderStatus, Shop } from './types';
import { MOCK_ORDERS } from './constants';
import UserView from './views/UserView';
import MerchantView from './views/MerchantView';
import DriverView from './views/DriverView';
import AdminView from './views/AdminView';
import { StoreIcon, TruckIcon, UserIcon, AdminIcon } from './components/Icons';

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>(UserRole.USER);
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status } : order
    ));
  };

  const handlePlaceOrder = (items: any[], shop: Shop) => {
    const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const newOrder: Order = {
      id: `ORD-${Math.floor(Math.random() * 900) + 100}`,
      shopId: shop.id,
      shopName: shop.name,
      userId: 'u1',
      userName: 'Carlos Silva',
      items: items.map(i => ({ menuItemId: i.id, quantity: i.quantity, name: i.name, price: i.price })),
      total,
      status: OrderStatus.PENDING,
      createdAt: new Date().toISOString(),
    };
    setOrders(prev => [newOrder, ...prev]);
  };

  const handleAcceptOrder = (orderId: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, driverId: 'driver-1' } : order
    ));
  };

  const renderContent = () => {
    switch (role) {
      case UserRole.USER:
        return <UserView onPlaceOrder={handlePlaceOrder} activeOrders={orders.filter(o => o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED)} />;
      case UserRole.MERCHANT:
        return <MerchantView orders={orders} onUpdateStatus={handleUpdateOrderStatus} />;
      case UserRole.DRIVER:
        return <DriverView orders={orders} onAcceptOrder={handleAcceptOrder} onUpdateStatus={handleUpdateOrderStatus} />;
      case UserRole.ADMIN:
        return <AdminView orders={orders} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-0 md:pt-20">
      {/* Navigation for Demo/Role Switching */}
      <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b z-50 px-4 py-2 hidden md:block">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">D</div>
            <span className="text-2xl font-black text-gray-900">Delivora</span>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {[
              { id: UserRole.USER, label: 'Cliente', icon: <UserIcon /> },
              { id: UserRole.MERCHANT, label: 'Lojista', icon: <StoreIcon /> },
              { id: UserRole.DRIVER, label: 'Entregador', icon: <TruckIcon /> },
              { id: UserRole.ADMIN, label: 'Admin', icon: <AdminIcon /> }
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setRole(r.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  role === r.id ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {r.icon} {r.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile Role Switcher (Bottom Nav) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden flex justify-around p-3 z-50">
        <button onClick={() => setRole(UserRole.USER)} className={`flex flex-col items-center ${role === UserRole.USER ? 'text-orange-500' : 'text-gray-400'}`}>
          <UserIcon /><span className="text-[10px] mt-1 font-bold">Cliente</span>
        </button>
        <button onClick={() => setRole(UserRole.MERCHANT)} className={`flex flex-col items-center ${role === UserRole.MERCHANT ? 'text-orange-500' : 'text-gray-400'}`}>
          <StoreIcon /><span className="text-[10px] mt-1 font-bold">Loja</span>
        </button>
        <button onClick={() => setRole(UserRole.DRIVER)} className={`flex flex-col items-center ${role === UserRole.DRIVER ? 'text-orange-500' : 'text-gray-400'}`}>
          <TruckIcon /><span className="text-[10px] mt-1 font-bold">Entrega</span>
        </button>
        <button onClick={() => setRole(UserRole.ADMIN)} className={`flex flex-col items-center ${role === UserRole.ADMIN ? 'text-orange-500' : 'text-gray-400'}`}>
          <AdminIcon /><span className="text-[10px] mt-1 font-bold">Admin</span>
        </button>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-4 pt-10">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;

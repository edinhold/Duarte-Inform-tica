
import React, { useState } from 'react';
import { Shop, MenuItem, Order, OrderStatus } from '../types';
import { MOCK_SHOPS } from '../constants';
import { CartIcon, TrashIcon } from '../components/Icons';

interface CartItem extends MenuItem {
  quantity: number;
}

interface UserViewProps {
  onPlaceOrder: (items: CartItem[], shop: Shop) => void;
  activeOrders: Order[];
}

const UserView: React.FC<UserViewProps> = ({ onPlaceOrder, activeOrders }) => {
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleCheckout = () => {
    if (selectedShop && cart.length > 0) {
      onPlaceOrder(cart, selectedShop);
      setCart([]);
      setSelectedShop(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <section>
        <h1 className="text-3xl font-bold text-gray-800">Fome de quê hoje?</h1>
        <p className="text-gray-500">Escolha os melhores restaurantes da sua região.</p>
      </section>

      {/* Active Orders */}
      {activeOrders.length > 0 && (
        <section className="bg-orange-50 border border-orange-200 p-4 rounded-xl">
          <h2 className="text-sm font-bold text-orange-800 uppercase tracking-wider mb-3">Pedidos em andamento</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {activeOrders.map(order => (
              <div key={order.id} className="min-w-[280px] bg-white p-4 rounded-lg shadow-sm border border-orange-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold">{order.shopName}</span>
                  <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full">{order.status}</span>
                </div>
                <p className="text-sm text-gray-500">{order.items.length} itens • R$ {order.total.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Shop List */}
      {!selectedShop ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_SHOPS.map(shop => (
            <div 
              key={shop.id} 
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100"
              onClick={() => setSelectedShop(shop)}
            >
              <img src={shop.image} alt={shop.name} className="w-full h-48 object-cover" />
              <div className="p-4">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-lg">{shop.name}</h3>
                  <span className="text-orange-500 font-bold">★ {shop.rating}</span>
                </div>
                <p className="text-gray-500 text-sm">{shop.category}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          <div className="relative h-48">
            <img src={selectedShop.image} alt={selectedShop.name} className="w-full h-full object-cover" />
            <button 
              onClick={() => setSelectedShop(null)}
              className="absolute top-4 left-4 bg-white/90 p-2 rounded-full shadow-lg"
            >
              ← Voltar
            </button>
          </div>
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">{selectedShop.name} - Menu</h2>
            <div className="grid gap-4">
              {selectedShop.menu.map(item => (
                <div key={item.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                  <div className="flex gap-4">
                    <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
                    <div>
                      <h4 className="font-semibold">{item.name}</h4>
                      <p className="text-sm text-gray-500 leading-tight">{item.description}</p>
                      <p className="text-orange-600 font-bold mt-1">R$ {item.price.toFixed(2)}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => addToCart(item)}
                    className="bg-orange-500 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-orange-600"
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating Cart */}
      {cart.length > 0 && (
        <div className="fixed bottom-8 right-8 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[500px]">
          <div className="p-4 border-b bg-orange-50 flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2"><CartIcon /> Carrinho</h3>
            <span className="text-xs font-semibold text-gray-500">{selectedShop?.name}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between items-center">
                <div className="text-sm">
                  <p className="font-semibold">{item.quantity}x {item.name}</p>
                  <p className="text-gray-500">R$ {(item.price * item.quantity).toFixed(2)}</p>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600">
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>
          <div className="p-4 border-t bg-gray-50">
            <div className="flex justify-between mb-4 font-bold text-lg">
              <span>Total:</span>
              <span>R$ {cartTotal.toFixed(2)}</span>
            </div>
            <button 
              onClick={handleCheckout}
              className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors"
            >
              Finalizar Pedido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserView;

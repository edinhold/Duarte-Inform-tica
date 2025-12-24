
import React, { useEffect, useState } from 'react';
import { Order, OrderStatus } from '../types';
import { geminiService } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface AdminViewProps {
  orders: Order[];
}

const AdminView: React.FC<AdminViewProps> = ({ orders }) => {
  const [insight, setInsight] = useState('Analisando ecossistema...');
  const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0);
  const deliveredCount = orders.filter(o => o.status === OrderStatus.DELIVERED).length;

  useEffect(() => {
    const fetchInsight = async () => {
      const res = await geminiService.getAdminInsights(totalRevenue, 1250);
      setInsight(res || '');
    };
    fetchInsight();
  }, [totalRevenue]);

  const chartData = [
    { name: 'Pizzas', value: 45 },
    { name: 'Burgers', value: 30 },
    { name: 'Sushi', value: 15 },
    { name: 'Sobremesas', value: 10 },
  ];

  const COLORS = ['#F97316', '#3B82F6', '#10B981', '#8B5CF6'];

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-bold">Administração Central</h1>
          <p className="text-gray-500">Visão geral de toda a rede Delivora.</p>
        </div>
      </header>

      {/* AI Platform Insight */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-2xl shadow-xl">
        <h3 className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Relatório Executivo Inteligente</h3>
        <p className="text-xl font-medium leading-relaxed">"{insight}"</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-gray-400 text-sm uppercase">Faturamento Global</p>
          <p className="text-3xl font-bold">R$ {totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-gray-400 text-sm uppercase">Entregas Concluídas</p>
          <p className="text-3xl font-bold text-green-600">{deliveredCount}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-gray-400 text-sm uppercase">Lojas Parceiras</p>
          <p className="text-3xl font-bold text-blue-600">42</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-gray-400 text-sm uppercase">Tempo Médio</p>
          <p className="text-3xl font-bold text-orange-600">28 min</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80">
          <h3 className="font-bold mb-4">Volume por Categoria (%)</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold mb-4">Ações do Administrador</h3>
          <div className="grid grid-cols-2 gap-4">
            <button className="bg-gray-100 p-4 rounded-xl text-left hover:bg-gray-200 transition-colors">
              <p className="font-bold">Gerenciar Lojas</p>
              <p className="text-xs text-gray-500">Aprovar novos cadastros</p>
            </button>
            <button className="bg-gray-100 p-4 rounded-xl text-left hover:bg-gray-200 transition-colors">
              <p className="font-bold">Relatórios Fiscais</p>
              <p className="text-xs text-gray-500">Download de faturas</p>
            </button>
            <button className="bg-gray-100 p-4 rounded-xl text-left hover:bg-gray-200 transition-colors">
              <p className="font-bold">Suporte</p>
              <p className="text-xs text-gray-500">2 chamados pendentes</p>
            </button>
            <button className="bg-gray-100 p-4 rounded-xl text-left hover:bg-gray-200 transition-colors">
              <p className="font-bold">Cupons</p>
              <p className="text-xs text-gray-500">Criar novas campanhas</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminView;

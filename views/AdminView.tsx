
import React, { useEffect, useState, useMemo } from 'react';
import { Order, OrderStatus, ApiSettings, PaymentMethod, User, UserRole, UserStatus } from '../types';
import { geminiService } from '../services/geminiService';

interface AdminViewProps {
  orders: Order[];
  users: User[];
  currentUser: User;
  onAddUser: (user: User) => void;
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
  onDeleteUser: (userId: string) => void;
  paymentSettings: ApiSettings;
  onUpdatePaymentSettings: (settings: ApiSettings) => void;
}

const AdminView: React.FC<AdminViewProps> = ({ orders, users, currentUser, onAddUser, onUpdateUser, onDeleteUser, paymentSettings, onUpdatePaymentSettings }) => {
  const [tab, setTab] = useState<'DASHBOARD' | 'PAYMENTS' | 'USERS' | 'PRICING' | 'SECURITY'>('DASHBOARD');
  const [insight, setInsight] = useState('Analisando ecossistema...');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [tempApiKey, setTempApiKey] = useState(paymentSettings.apiKey);
  const [lastUserCount, setLastUserCount] = useState(users.length);
  const [showNewUserAlert, setShowNewUserAlert] = useState(false);

  const isSuper = currentUser.role === UserRole.SUPER_ADMIN;
  const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0);

  useEffect(() => {
    if (users.length > lastUserCount) {
      setShowNewUserAlert(true);
      const timer = setTimeout(() => setShowNewUserAlert(false), 5000);
      setLastUserCount(users.length);
      return () => clearTimeout(timer);
    }
  }, [users.length, lastUserCount]);

  const sortedUsers = useMemo(() => {
    return [...users]
      .filter(u => !u.role.includes('ADMIN') || isSuper)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [users, isSuper]);

  useEffect(() => {
    const fetchInsight = async () => {
      const res = await geminiService.getAdminInsights(totalRevenue, users.length);
      setInsight(res || '');
    };
    fetchInsight();
  }, [totalRevenue, users.length]);

  const handleSaveApi = () => {
    onUpdatePaymentSettings({ ...paymentSettings, apiKey: tempApiKey });
    alert("Infraestrutura de pagamentos atualizada! O sistema Pré-Pago foi sincronizado.");
  };

  const updateRegionSurcharge = (id: string, value: number) => {
    const updatedRegions = paymentSettings.pricing.regions.map(r => 
      r.id === id ? { ...r, surcharge: value } : r
    );
    onUpdatePaymentSettings({
      ...paymentSettings,
      pricing: { ...paymentSettings.pricing, regions: updatedRegions }
    });
  };

  const addRegion = () => {
    const newRegion = { id: Date.now().toString(), name: 'Novo Bairro / Região', surcharge: 0 };
    onUpdatePaymentSettings({
      ...paymentSettings,
      pricing: { ...paymentSettings.pricing, regions: [...paymentSettings.pricing.regions, newRegion] }
    });
  };

  const removeRegion = (id: string) => {
    onUpdatePaymentSettings({
      ...paymentSettings,
      pricing: { ...paymentSettings.pricing, regions: paymentSettings.pricing.regions.filter(r => r.id !== id) }
    });
  };

  const adminUsers = users.filter(u => [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(u.role));

  return (
    <div className="space-y-6">
      {editingUser && (
        <div className="fixed inset-0 bg-indigo-950/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-8 shadow-2xl max-h-[90vh] overflow-y-auto border border-indigo-100 animate-in zoom-in duration-300">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-indigo-950">Editar Registro Duarte</h3>
                <button onClick={() => setEditingUser(null)} className="text-indigo-200 hover:text-indigo-600 transition-colors text-2xl">✕</button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <label className="text-[10px] font-black text-indigo-300 uppercase block mb-1 ml-1">Nome / Razão Social</label>
                   <input className="w-full bg-indigo-50/50 border-0 rounded-xl p-3 text-indigo-900 font-medium" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} />
                </div>
                <div>
                   <label className="text-[10px] font-black text-indigo-300 uppercase block mb-1 ml-1">Documento (CPF/CNPJ)</label>
                   <input className="w-full bg-indigo-50/50 border-0 rounded-xl p-3 text-indigo-900 font-medium" value={editingUser.document} onChange={e => setEditingUser({...editingUser, document: e.target.value})} />
                </div>
                {isSuper && (
                  <div>
                    <label className="text-[10px] font-black text-indigo-300 uppercase block mb-1 ml-1">Papel Administrativo</label>
                    <select className="w-full bg-indigo-50/50 border-0 rounded-xl p-3 text-indigo-900 font-bold" value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as any})}>
                      <option value={UserRole.USER}>Cliente Comum</option>
                      <option value={UserRole.DRIVER}>Motorista Parceiro</option>
                      <option value={UserRole.MERCHANT}>Lojista / Merchant</option>
                      <option value={UserRole.ADMIN}>Administrador de Rede</option>
                      <option value={UserRole.SUPER_ADMIN}>Super Admin (Root)</option>
                    </select>
                  </div>
                )}
                <div className="md:col-span-2">
                   <label className="text-[10px] font-black text-indigo-300 uppercase block mb-1 ml-1">Endereço Registrado</label>
                   <input className="w-full bg-indigo-50/50 border-0 rounded-xl p-3 text-indigo-900 font-medium" value={editingUser.address} onChange={e => setEditingUser({...editingUser, address: e.target.value})} />
                </div>
                <div>
                   <label className="text-[10px] font-black text-indigo-300 uppercase block mb-1 ml-1">Telefone Contato</label>
                   <input className="w-full bg-indigo-50/50 border-0 rounded-xl p-3 text-indigo-900 font-medium" value={editingUser.phone} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} />
                </div>
                <div>
                   <label className="text-[10px] font-black text-indigo-300 uppercase block mb-1 ml-1">Status da Conta</label>
                   <select className="w-full bg-indigo-50/50 border-0 rounded-xl p-3 text-indigo-900 font-bold" value={editingUser.status} onChange={e => setEditingUser({...editingUser, status: e.target.value as any})}>
                      <option value={UserStatus.ACTIVE}>Ativo e Operante</option>
                      <option value={UserStatus.INACTIVE}>Suspenso / Inativo</option>
                   </select>
                </div>
             </div>
             <div className="flex gap-4 mt-8">
                <button onClick={() => { onUpdateUser(editingUser.id, editingUser); setEditingUser(null); }} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all">Salvar Alterações</button>
                <button onClick={() => setEditingUser(null)} className="flex-1 bg-indigo-50 text-indigo-400 py-4 rounded-2xl font-black hover:bg-indigo-100 transition-all">Cancelar</button>
             </div>
          </div>
        </div>
      )}

      <header className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-indigo-50">
        <div>
          <h1 className="text-2xl font-black text-indigo-950 flex items-center gap-3">
             {isSuper && <span className="text-2xl" title="Super Usuário">👑</span>}
             Gestão Duarte Delivery
          </h1>
          <div className="flex gap-4 mt-2">
            {[
              { id: 'DASHBOARD', label: 'Estatísticas' },
              { id: 'USERS', label: 'Contas & Registros' },
              { id: 'PRICING', label: 'Tarifário' },
              { id: 'PAYMENTS', label: 'Pagamentos' },
              ...(isSuper ? [{ id: 'SECURITY', label: '🛡️ Segurança' }] : [])
            ].map((t) => (
              <button 
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={`text-xs font-black pb-1 border-b-2 transition-all uppercase tracking-widest ${tab === t.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-indigo-200 hover:text-indigo-400'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {tab === 'USERS' && (
        <div className="space-y-4 animate-in fade-in duration-500">
          <div className="flex justify-between items-center px-4">
             <div className="flex items-center gap-3">
                <div className={`w-3 h-3 ${showNewUserAlert ? 'bg-green-500 animate-ping' : 'bg-green-500'} rounded-full`}></div>
                <h2 className="text-xs font-black text-indigo-400 uppercase tracking-widest">
                  {showNewUserAlert ? 'NOVO CADASTRO DETECTADO!' : 'Base de Usuários Ativa'}
                </h2>
             </div>
             <div className="flex items-center gap-4">
                <span className="text-[10px] bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full font-black border border-indigo-100">
                  {users.length} TOTAL DE CONTAS
                </span>
             </div>
          </div>

          <div className="bg-white rounded-[2rem] shadow-sm border border-indigo-50 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-indigo-50/30 border-b border-indigo-50">
                  <th className="px-6 py-4 text-xs font-bold text-indigo-400 uppercase tracking-widest">Identificação</th>
                  <th className="px-6 py-4 text-xs font-bold text-indigo-400 uppercase tracking-widest">Categoria</th>
                  <th className="px-6 py-4 text-xs font-bold text-indigo-400 uppercase tracking-widest">Registro em</th>
                  <th className="px-6 py-4 text-xs font-bold text-indigo-400 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-50">
                {sortedUsers.map((user) => {
                  const isVeryNew = new Date().getTime() - new Date(user.createdAt).getTime() < 60000;
                  return (
                    <tr key={user.id} className={`transition-all duration-1000 ${isVeryNew ? 'bg-green-50/30' : 'hover:bg-indigo-50/20'}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 ${user.role === UserRole.SUPER_ADMIN ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'} rounded-full flex items-center justify-center font-bold uppercase shadow-sm relative`}>
                            {user.name[0]}
                            {isVeryNew && <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] text-white font-black animate-bounce">!</div>}
                          </div>
                          <div>
                            <p className="font-bold text-indigo-950 flex items-center gap-2">
                              {user.name}
                              {isVeryNew && <span className="text-[8px] bg-green-500 text-white px-1.5 py-0.5 rounded-full font-black animate-pulse">NOVO</span>}
                            </p>
                            <p className="text-[10px] text-indigo-300 font-bold">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest ${
                          user.role === UserRole.SUPER_ADMIN ? 'bg-amber-500 text-white' :
                          user.role === UserRole.ADMIN ? 'bg-indigo-900 text-white' : 
                          user.role === UserRole.DRIVER ? 'bg-indigo-600 text-white' :
                          user.role === UserRole.MERCHANT ? 'bg-indigo-100 text-indigo-600' : 'bg-indigo-50 text-indigo-300'
                        }`}>
                          {user.role}
                        </span>
                        <p className="text-[10px] font-black text-indigo-400 mt-1.5">{user.document || 'DOC PENDENTE'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[10px] font-bold text-indigo-300">
                          {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-[9px] font-black text-indigo-200 uppercase">
                          {new Date(user.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => setEditingUser(user)} className="text-xs font-black text-indigo-600 hover:bg-indigo-100 px-4 py-1.5 rounded-xl transition-all border border-transparent hover:border-indigo-100">Editar</button>
                        {user.id !== currentUser.id && (
                           <button onClick={() => onDeleteUser(user.id)} className="text-xs font-black text-red-400 hover:bg-red-50 px-4 py-1.5 rounded-xl transition-all">Excluir</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'PRICING' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom duration-500">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-indigo-50 space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-indigo-950">Motor de Tarifas Duarte</h3>
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-lg">Cálculo em Tempo Real</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100">
                  <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2">Taxa de Saída</label>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-indigo-900 text-lg">R$</span>
                    <input 
                      type="number"
                      value={paymentSettings.pricing.baseFee}
                      onChange={e => onUpdatePaymentSettings({...paymentSettings, pricing: {...paymentSettings.pricing, baseFee: parseFloat(e.target.value)}})}
                      className="w-full bg-white border-0 rounded-2xl p-4 font-black text-2xl text-indigo-600 focus:ring-0 shadow-inner"
                    />
                  </div>
                </div>

                <div className="p-6 bg-indigo-50/30 rounded-3xl border border-indigo-100">
                  <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2">Preço por KM</label>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-indigo-900 text-lg">R$</span>
                    <input 
                      type="number"
                      value={paymentSettings.pricing.perKmRate}
                      onChange={e => onUpdatePaymentSettings({...paymentSettings, pricing: {...paymentSettings.pricing, perKmRate: parseFloat(e.target.value)}})}
                      className="w-full bg-white border-0 rounded-2xl p-4 font-black text-2xl text-indigo-950 focus:ring-0 shadow-inner"
                    />
                  </div>
                </div>

                <div className="p-6 bg-indigo-900 rounded-3xl border border-indigo-950 shadow-xl shadow-indigo-100">
                  <label className="block text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-2">Tarifa Mínima</label>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-white text-lg">R$</span>
                    <input 
                      type="number"
                      value={paymentSettings.pricing.minFare}
                      onChange={e => onUpdatePaymentSettings({...paymentSettings, pricing: {...paymentSettings.pricing, minFare: parseFloat(e.target.value)}})}
                      className="w-full bg-white/10 border-0 rounded-2xl p-4 font-black text-2xl text-white focus:ring-0 shadow-inner"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-black uppercase tracking-widest text-indigo-950">Configuração por Região / Bairro</h4>
                  <button onClick={addRegion} className="text-[10px] bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-black uppercase shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">+ Novo Bairro</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paymentSettings.pricing.regions.map(region => (
                    <div key={region.id} className="flex flex-col gap-3 bg-indigo-50/20 p-5 rounded-3xl border border-indigo-50 hover:border-indigo-200 transition-all group relative">
                      <div className="flex justify-between items-center">
                        <input 
                          className="bg-transparent border-0 font-black text-indigo-950 p-0 text-sm focus:ring-0"
                          value={region.name}
                          placeholder="Nome do Bairro"
                          onChange={e => {
                            const updated = paymentSettings.pricing.regions.map(r => r.id === region.id ? {...r, name: e.target.value} : r);
                            onUpdatePaymentSettings({...paymentSettings, pricing: {...paymentSettings.pricing, regions: updated}});
                          }}
                        />
                        <button onClick={() => removeRegion(region.id)} className="text-red-300 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-lg">✕</button>
                      </div>
                      <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-2xl border border-indigo-50 shadow-sm">
                        <span className="text-[10px] font-black text-indigo-300 uppercase">Sobretaxa: R$</span>
                        <input 
                          type="number"
                          className="w-full font-black text-right focus:ring-0 border-0 text-indigo-600 p-0"
                          value={region.surcharge}
                          onChange={e => updateRegionSurcharge(region.id, parseFloat(e.target.value))}
                        />
                      </div>
                    </div>
                  ))}
                  {paymentSettings.pricing.regions.length === 0 && (
                    <div className="md:col-span-2 p-10 border-2 border-dashed border-indigo-100 rounded-[2.5rem] text-center">
                      <p className="text-indigo-200 text-sm font-bold italic">Nenhuma região com tarifa especial configurada.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-indigo-950 text-white p-8 rounded-[3rem] shadow-xl border border-indigo-900">
               <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4">Lógica de Cálculo</h3>
               <div className="space-y-4">
                 <div className="flex justify-between items-center border-b border-white/10 pb-3">
                   <span className="text-xs opacity-60">Saída Fixa</span>
                   <span className="font-bold">R$ {paymentSettings.pricing.baseFee.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-center py-2 opacity-30 text-xl font-black">+</div>
                 <div className="flex justify-between items-center border-b border-white/10 pb-3">
                   <span className="text-xs opacity-60">Distância (KM)</span>
                   <span className="font-bold">R$ {paymentSettings.pricing.perKmRate.toFixed(2)}/km</span>
                 </div>
                 <div className="flex justify-center py-2 opacity-30 text-xl font-black">+</div>
                 <div className="flex justify-between items-center border-b border-white/10 pb-3">
                   <span className="text-xs opacity-60">Adicional Bairro</span>
                   <span className="font-bold">Variável</span>
                 </div>
                 <div className="bg-indigo-600 p-4 rounded-2xl mt-4">
                   <p className="text-[10px] font-black uppercase text-indigo-200 mb-1">Regra de Ouro</p>
                   <p className="text-xs font-medium leading-relaxed">Se o resultado for menor que <span className="font-black text-white">R$ {paymentSettings.pricing.minFare.toFixed(2)}</span>, o sistema aplicará a <span className="underline decoration-indigo-400">Tarifa Mínima</span> automaticamente.</p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'DASHBOARD' && (
        <div className="bg-indigo-900 text-white p-10 rounded-[3rem] shadow-xl border border-indigo-800 animate-in zoom-in duration-500 relative overflow-hidden">
           <div className="relative z-10">
              <h3 className="text-xs font-black uppercase tracking-widest opacity-60 mb-2">Relatório de Crescimento Duarte</h3>
              <p className="text-3xl font-medium leading-tight italic">"{insight}"</p>
           </div>
           <div className="absolute top-0 right-0 p-10 opacity-10">
              <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
           </div>
        </div>
      )}

      {tab === 'PAYMENTS' && (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-indigo-50 animate-in fade-in duration-500 space-y-8">
           <div className="flex justify-between items-start">
              <h3 className="text-xl font-black text-indigo-950">Infraestrutura de Pagamentos</h3>
              <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${paymentSettings.apiKey ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                 {paymentSettings.apiKey ? '🚀 Pré-Pago Ativado' : '⚠️ Aguardando Configuração'}
              </div>
           </div>
           
           <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100 mb-8">
              <p className="text-sm font-bold text-indigo-900">Configuração do Sistema Pré-Pago:</p>
              <p className="text-xs text-indigo-400 mt-1">Ao inserir uma chave de API válida, a funcionalidade de Carteira Duarte será automaticamente disponibilizada para todos os usuários.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                 <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-1">Gateway de Duarte</label>
                 <select value={paymentSettings.paymentGateway} onChange={e => onUpdatePaymentSettings({...paymentSettings, paymentGateway: e.target.value})} className="w-full bg-white border border-indigo-100 rounded-2xl p-4 font-bold text-indigo-900">
                    <option value="Stripe">Stripe (Global)</option>
                    <option value="MercadoPago">Mercado Pago (BR)</option>
                 </select>
              </div>
              <div className="space-y-4">
                 <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-1">Chave da API (Production/Sandbox)</label>
                 <input 
                    type="password" 
                    placeholder="sk_live_..."
                    value={tempApiKey} 
                    onChange={e => setTempApiKey(e.target.value)} 
                    className="w-full bg-white border border-indigo-100 rounded-2xl p-4 font-mono text-indigo-900" 
                 />
              </div>
           </div>
           
           <button onClick={handleSaveApi} className="bg-indigo-950 text-white px-10 py-5 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-black transition-all">Salvar & Ativar Carteiras</button>
        </div>
      )}
    </div>
  );
};

export default AdminView;

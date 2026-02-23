
import React, { useEffect, useState, useMemo } from 'react';
import { Order, OrderStatus, ApiSettings, PaymentMethod, User, UserRole, UserStatus, ServiceType, WithdrawalRequest, RegionSurcharge, TopUpProduct, ActivationCode } from '../types';
import { TrashIcon, MapPinIcon, UserIcon } from '../components/Icons';

interface AdminViewProps {
  orders: Order[];
  users: User[];
  currentUser: User;
  onAddUser: (user: User) => void;
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
  onDeleteUser: (userId: string) => void;
  onDeleteOrder: (orderId: string) => void;
  paymentSettings: ApiSettings;
  onUpdatePaymentSettings: (settings: ApiSettings) => void;
  withdrawalRequests: WithdrawalRequest[];
  onProcessWithdrawal: (requestId: string, status: 'COMPLETED' | 'REJECTED') => void;
}

const AdminView: React.FC<AdminViewProps> = ({ 
  orders, users, currentUser, onAddUser, onUpdateUser, onDeleteUser, onDeleteOrder,
  paymentSettings, onUpdatePaymentSettings, withdrawalRequests, onProcessWithdrawal 
}) => {
  const [tab, setTab] = useState<'CRM' | 'USERS' | 'PRICING' | 'PAYMENTS' | 'WITHDRAWALS'>('CRM');
  const [userFilter, setUserFilter] = useState<UserStatus | 'ALL'>('ALL');
  
  const [editModal, setEditModal] = useState<{isOpen: boolean, userId: string, userName: string, userRole: UserRole}>({
    isOpen: false, 
    userId: '', 
    userName: '',
    userRole: UserRole.USER
  });
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>(UserRole.USER);
  const [editPassword, setEditPassword] = useState('');

  const [newRegion, setNewRegion] = useState({ name: '', surcharge: 0 });
  const [newTopUpProduct, setNewTopUpProduct] = useState({ name: '', amount: 0, description: '', purchaseLink: '' });
  const [newCode, setNewCode] = useState({ code: '', value: 0, multiUse: false });

  // Estado para troca de senha do próprio admin
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [isAdminSaving, setIsAdminSaving] = useState(false);

  const handleAdminUpdatePassword = () => {
    if (!adminNewPassword.trim() || adminNewPassword.length < 6) {
      return alert("A nova senha deve ter pelo menos 6 caracteres.");
    }
    setIsAdminSaving(true);
    setTimeout(() => {
      onUpdateUser(currentUser.id, { password: adminNewPassword });
      setAdminNewPassword('');
      setIsAdminSaving(false);
      alert("Sua senha administrativa foi alterada com sucesso!");
    }, 800);
  };

  const filteredUsers = useMemo(() => {
    if (userFilter === 'ALL') return users;
    return users.filter(u => u.status === userFilter);
  }, [users, userFilter]);

  const activeUsersCount = useMemo(() => users.filter(u => u.status === UserStatus.ACTIVE).length, [users]);

  const openEditUser = (user: User) => {
    setEditModal({
      isOpen: true,
      userId: user.id,
      userName: user.name,
      userRole: user.role
    });
    setEditName(user.name);
    setEditRole(user.role);
    setEditPassword('');
  };

  const handleSaveUserEdit = () => {
    if (!editName.trim()) return alert("Nome não pode ser vazio.");
    const updates: Partial<User> = { name: editName, role: editRole };
    if (editPassword.trim()) updates.password = editPassword;
    onUpdateUser(editModal.userId, updates);
    setEditModal({ ...editModal, isOpen: false });
  };

  const handleUpdateGeneralPricing = (field: string, value: number) => {
    onUpdatePaymentSettings({
      ...paymentSettings,
      pricing: { ...paymentSettings.pricing, [field]: value }
    });
  };

  const handleAddRegion = () => {
    if (!newRegion.name || newRegion.surcharge < 0) return alert("Preencha o nome da região e um valor válido!");
    const regions = [...(paymentSettings.pricing.regions || []), { ...newRegion, id: Date.now().toString() }];
    onUpdatePaymentSettings({ ...paymentSettings, pricing: { ...paymentSettings.pricing, regions } });
    setNewRegion({ name: '', surcharge: 0 });
  };

  const handleRemoveRegion = (id: string) => {
    const regions = paymentSettings.pricing.regions.filter(r => r.id !== id);
    onUpdatePaymentSettings({ ...paymentSettings, pricing: { ...paymentSettings.pricing, regions } });
  };

  const handleToggleUserStatus = (userId: string, currentStatus: UserStatus) => {
    const newStatus = currentStatus === UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE;
    onUpdateUser(userId, { status: newStatus });
  };

  const handleAddTopUpProduct = () => {
    if (!newTopUpProduct.name || newTopUpProduct.amount <= 0 || !newTopUpProduct.purchaseLink) {
      return alert("Preencha Nome, Valor e seu Link de Compras!");
    }
    const topUpProducts = [...(paymentSettings.pricing.topUpProducts || []), { ...newTopUpProduct, id: Date.now().toString() }];
    onUpdatePaymentSettings({ ...paymentSettings, pricing: { ...paymentSettings.pricing, topUpProducts } });
    setNewTopUpProduct({ name: '', amount: 0, description: '', purchaseLink: '' });
  };

  const handleRemoveTopUpProduct = (id: string) => {
    const topUpProducts = (paymentSettings.pricing.topUpProducts || []).filter(p => p.id !== id);
    onUpdatePaymentSettings({ ...paymentSettings, pricing: { ...paymentSettings.pricing, topUpProducts } });
  };

  const handleAddActivationCode = () => {
    if (!newCode.code || newCode.value <= 0) return alert("Dados inválidos para o código!");
    const activationCodes = [...(paymentSettings.activationCodes || []), { 
      id: Date.now().toString(), 
      code: newCode.code.toUpperCase(), 
      value: newCode.value, 
      isUsed: false,
      multiUse: newCode.multiUse,
      usedByEmails: [],
      createdAt: new Date().toISOString()
    }];
    onUpdatePaymentSettings({ ...paymentSettings, activationCodes });
    setNewCode({ code: '', value: 0, multiUse: false });
  };

  const handleRemoveCode = (id: string) => {
    const activationCodes = paymentSettings.activationCodes.filter(c => c.id !== id);
    onUpdatePaymentSettings({ ...paymentSettings, activationCodes });
  };

  const urgentEarlyWithdrawals = useMemo(() => 
    withdrawalRequests.filter(r => r.status === 'PENDING' && r.isEarly), 
  [withdrawalRequests]);

  const completedRides = useMemo(() => 
    orders.filter(o => o.status === OrderStatus.COMPLETED || o.status === OrderStatus.DELIVERED),
  [orders]);

  return (
    <div className="space-y-12 pb-12 animate-in fade-in duration-500 relative">
      
      {editModal.isOpen && (
        <div className="fixed inset-0 bg-indigo-950/90 backdrop-blur-md z-[300] flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-in zoom-in duration-300 space-y-6">
              <div className="text-center">
                 <h3 className="text-2xl font-black text-indigo-950 uppercase tracking-tighter">Editar Usuário</h3>
                 <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest mt-1">ID: {editModal.userId}</p>
              </div>
              <div className="space-y-4">
                 <div>
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1 ml-2">Nome Completo</label>
                    <input className="w-full bg-indigo-50 border-0 rounded-2xl p-4 font-bold text-indigo-950" value={editName} onChange={e => setEditName(e.target.value)} />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1 ml-2">Função / Cargo</label>
                    <select className="w-full bg-indigo-50 border-0 rounded-2xl p-4 font-bold text-indigo-950" value={editRole} onChange={e => setEditRole(e.target.value as UserRole)}>
                       <option value={UserRole.USER}>CLIENTE</option>
                       <option value={UserRole.DRIVER}>ENTREGADOR / MOTORISTA</option>
                       <option value={UserRole.MERCHANT}>LOJISTA</option>
                       <option value={UserRole.ADMIN}>ADMINISTRADOR</option>
                       <option value={UserRole.SUPER_ADMIN}>SUPER ADMIN</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1 ml-2">Alterar Senha</label>
                    <input type="password" className="w-full bg-indigo-50 border-0 rounded-2xl p-4 font-bold text-indigo-950" placeholder="Digite a nova senha (opcional)" value={editPassword} onChange={e => setEditPassword(e.target.value)} />
                 </div>
              </div>
              <div className="pt-4 space-y-3">
                 <button onClick={handleSaveUserEdit} className="w-full bg-indigo-950 text-white py-5 rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl">Salvar Alterações</button>
                 <button onClick={() => setEditModal({ ...editModal, isOpen: false })} className="w-full text-indigo-300 text-[10px] font-black uppercase tracking-widest">Cancelar</button>
              </div>
           </div>
        </div>
      )}

      <header className="bg-white p-4 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-indigo-50 flex flex-col lg:flex-row justify-between items-center gap-4 md:gap-6">
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-950 text-white rounded-xl md:rounded-2xl flex items-center justify-center font-black text-sm md:text-base shrink-0">AD</div>
          <h1 className="text-xl md:text-2xl font-black text-indigo-950 uppercase tracking-tighter">Duarte Admin</h1>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar w-full lg:w-auto">
          {[
            { id: 'CRM', label: 'Início' },
            { id: 'USERS', label: 'Usuários' },
            { id: 'PRICING', label: 'Catálogo & Logística' },
            { id: 'WITHDRAWALS', label: 'Financeiro' },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id as any)} className={`relative flex items-center gap-2 text-[8px] md:text-[10px] font-black px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl transition-all uppercase tracking-widest whitespace-nowrap ${tab === t.id ? 'bg-indigo-950 text-white shadow-xl scale-105' : 'bg-white text-indigo-300 hover:bg-indigo-50 border border-indigo-50'}`}>
               {t.label}
            </button>
          ))}
        </div>
      </header>

      {tab === 'WITHDRAWALS' && (
        <div className="space-y-8 animate-in slide-in-from-right duration-500">
           {/* Configurações Financeiras */}
           <div className="bg-white p-10 rounded-[3rem] border border-indigo-50 shadow-sm space-y-8">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-indigo-950 text-white rounded-2xl flex items-center justify-center text-xl">💰</div>
                 <div>
                    <h3 className="text-xl font-black text-indigo-950 uppercase">Configurações Financeiras</h3>
                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Taxas e prazos para motoristas</p>
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-indigo-400 uppercase ml-2 tracking-widest">Taxa de Antecipação (%)</label>
                    <input 
                       type="number" 
                       className="w-full bg-indigo-50 border-0 rounded-2xl p-5 font-black text-indigo-950" 
                       value={paymentSettings.earlyWithdrawalFee} 
                       onChange={e => onUpdatePaymentSettings({...paymentSettings, earlyWithdrawalFee: parseFloat(e.target.value)})} 
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-indigo-400 uppercase ml-2 tracking-widest">Dia Padrão de Recebimento</label>
                    <select 
                       className="w-full bg-indigo-50 border-0 rounded-2xl p-5 font-black text-indigo-950" 
                       value={paymentSettings.defaultWithdrawalDay || 'Segunda-feira'}
                       onChange={e => onUpdatePaymentSettings({...paymentSettings, defaultWithdrawalDay: e.target.value})}
                    >
                       <option value="Segunda-feira">Segunda-feira</option>
                       <option value="Terça-feira">Terça-feira</option>
                       <option value="Quarta-feira">Quarta-feira</option>
                       <option value="Quinta-feira">Quinta-feira</option>
                       <option value="Sexta-feira">Sexta-feira</option>
                       <option value="Sábado">Sábado</option>
                       <option value="Domingo">Domingo</option>
                    </select>
                 </div>
              </div>
           </div>

           {/* Solicitações de Saque */}
           <div className="bg-white p-10 rounded-[3rem] border border-indigo-50 shadow-sm space-y-6">
              <h3 className="text-xl font-black text-indigo-950 uppercase">Solicitações Pendentes</h3>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="border-b border-indigo-50 text-[10px] font-black text-indigo-300 uppercase tracking-widest">
                          <th className="pb-4">Motorista</th>
                          <th className="pb-4">Chave PIX</th>
                          <th className="pb-4">Valor Líquido</th>
                          <th className="pb-4">Tipo</th>
                          <th className="pb-4 text-right">Ações</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-indigo-50">
                       {withdrawalRequests.filter(r => r.status === 'PENDING').map(req => (
                          <tr key={req.id} className="hover:bg-indigo-50/20">
                             <td className="py-4 font-bold text-indigo-950">{req.userName}</td>
                             <td className="py-4">
                               <div className="bg-indigo-50 px-3 py-1.5 rounded-xl inline-block border border-indigo-100">
                                  <p className="text-[9px] font-black text-indigo-400 uppercase leading-none mb-1">PIX</p>
                                  <p className="text-[10px] font-bold text-indigo-900">{req.pixKey || 'Não cadastrada'}</p>
                               </div>
                             </td>
                             <td className="py-4 font-black text-green-600">R$ {req.netAmount.toFixed(2)}</td>
                             <td className="py-4">
                                {req.isEarly ? <span className="text-[9px] font-black bg-amber-100 text-amber-600 px-2 py-1 rounded">ANTECIPAÇÃO</span> : <span className="text-[9px] font-black bg-indigo-100 text-indigo-600 px-2 py-1 rounded">AGENDADO</span>}
                             </td>
                             <td className="py-4 text-right space-x-2">
                                <button onClick={() => onProcessWithdrawal(req.id, 'COMPLETED')} className="bg-green-600 text-white px-4 py-2 rounded-lg font-black text-[9px] uppercase">Pagar</button>
                                <button onClick={() => onProcessWithdrawal(req.id, 'REJECTED')} className="bg-red-500 text-white px-4 py-2 rounded-lg font-black text-[9px] uppercase">Recusar</button>
                             </td>
                          </tr>
                       ))}
                       {withdrawalRequests.filter(r => r.status === 'PENDING').length === 0 && (
                          <tr><td colSpan={5} className="py-10 text-center text-indigo-300 font-bold uppercase text-[10px]">Nenhum saque pendente</td></tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>

           {/* Relatório Geral de Corridas/Entregas */}
           <div className="bg-white p-10 rounded-[3rem] border border-indigo-50 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                 <h3 className="text-xl font-black text-indigo-950 uppercase">Relatório de Corridas Realizadas</h3>
                 <div className="bg-indigo-50 px-4 py-2 rounded-xl">
                    <p className="text-[10px] font-black text-indigo-400 uppercase">Total Finalizado</p>
                    <p className="text-lg font-black text-indigo-950">{completedRides.length}</p>
                 </div>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="border-b border-indigo-50 text-[10px] font-black text-indigo-300 uppercase tracking-widest">
                          <th className="pb-4">Tipo</th>
                          <th className="pb-4">Motorista</th>
                          <th className="pb-4">Origem</th>
                          <th className="pb-4">Destino</th>
                          <th className="pb-4">Valor Bruto</th>
                          <th className="pb-4 text-right">Ações</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-indigo-50">
                       {completedRides.map(order => {
                          const origin = order.type === ServiceType.FOOD ? order.shopName : order.type === ServiceType.PARCEL ? (order.parcelDetails?.senderName || 'Ponto de Coleta') : (order.rideDetails?.origin || 'Início da Corrida');
                          const dest = order.type === ServiceType.RIDE ? order.rideDetails?.destination : (order.parcelDetails?.destination || 'Destino Local');
                          const driverName = users.find(u => u.id === order.driverId)?.name || 'N/A';
                          
                          return (
                             <tr key={order.id} className="hover:bg-indigo-50/20 group">
                                <td className="py-4">
                                   <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${order.type === ServiceType.RIDE ? 'bg-green-100 text-green-600' : order.type === ServiceType.FOOD ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'}`}>
                                      {order.type}
                                   </span>
                                </td>
                                <td className="py-4 font-bold text-indigo-900 text-xs uppercase">{driverName}</td>
                                <td className="py-4 text-xs font-medium text-indigo-950 max-w-[150px] truncate" title={origin}>{origin}</td>
                                <td className="py-4 text-xs font-medium text-indigo-950 max-w-[150px] truncate" title={dest}>{dest}</td>
                                <td className="py-4 font-black text-indigo-950 text-xs">R$ {order.total.toFixed(2)}</td>
                                <td className="py-4 text-right">
                                   <button 
                                      onClick={() => { if(window.confirm('Excluir este registro permanentemente?')) onDeleteOrder(order.id) }} 
                                      className="text-red-300 hover:text-red-500 transition-colors"
                                   >
                                      <TrashIcon />
                                   </button>
                                </td>
                             </tr>
                          );
                       })}
                       {completedRides.length === 0 && (
                          <tr><td colSpan={6} className="py-10 text-center text-indigo-300 font-bold uppercase text-[10px]">Nenhuma corrida finalizada no sistema</td></tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}

      {tab === 'PRICING' && (
        <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
           
           <div className="bg-white p-10 rounded-[3rem] border border-indigo-50 shadow-sm space-y-8">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-xl">🔑</div>
                 <div>
                    <h3 className="text-xl font-black text-indigo-950 uppercase">Códigos de Ativação</h3>
                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Gere vouchers que podem ser usados por vários usuários</p>
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-amber-50/30 p-8 rounded-[2rem] border border-amber-100">
                 <div className="md:col-span-4 space-y-1">
                    <label className="text-[9px] font-black text-indigo-400 uppercase ml-2">Código Único</label>
                    <input className="w-full bg-white border border-indigo-100 rounded-xl p-4 font-black text-indigo-900 uppercase tracking-widest" placeholder="DUARTE2024" value={newCode.code} onChange={e => setNewCode({...newCode, code: e.target.value})} />
                 </div>
                 <div className="md:col-span-2 space-y-1">
                    <label className="text-[9px] font-black text-indigo-400 uppercase ml-2">Valor (R$)</label>
                    <input type="number" className="w-full bg-white border border-indigo-100 rounded-xl p-4 font-bold" placeholder="50.00" value={newCode.value || ''} onChange={e => setNewCode({...newCode, value: parseFloat(e.target.value)})} />
                 </div>
                 <div className="md:col-span-4 flex items-center gap-3 px-4 py-2">
                    <input 
                       type="checkbox" 
                       id="multiUse" 
                       className="w-5 h-5 rounded accent-indigo-950" 
                       checked={newCode.multiUse} 
                       onChange={e => setNewCode({...newCode, multiUse: e.target.checked})} 
                    />
                    <label htmlFor="multiUse" className="text-[10px] font-black text-indigo-950 uppercase tracking-tight leading-none cursor-pointer">Permitir múltiplos usos (um por email)</label>
                 </div>
                 <div className="md:col-span-2">
                    <button onClick={handleAddActivationCode} className="w-full bg-amber-600 text-white py-4 rounded-xl font-black uppercase text-[10px] shadow-lg">Criar</button>
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {(paymentSettings.activationCodes || []).map(code => (
                    <div key={code.id} className="p-6 bg-white border rounded-[2rem] shadow-sm flex justify-between items-center group">
                       <div>
                          <p className="font-black text-indigo-950 text-sm uppercase tracking-widest">{code.code}</p>
                          <p className="text-xs font-bold text-green-600">R$ {code.value.toFixed(2)}</p>
                          <div className="flex gap-2 mt-1">
                             <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${code.multiUse ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'}`}>{code.multiUse ? 'Multi-uso' : 'Uso Único'}</span>
                             {code.multiUse && <span className="text-[8px] font-black text-indigo-300 uppercase">Usos: {code.usedByEmails?.length || 0}</span>}
                          </div>
                       </div>
                       <button onClick={() => handleRemoveCode(code.id)} className="text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100">
                          <TrashIcon />
                       </button>
                    </div>
                 ))}
              </div>
           </div>

           {/* Tarifas de Logística */}
           <div className="bg-white p-10 rounded-[3rem] border border-indigo-50 shadow-sm space-y-8">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl">🚚</div>
                 <div>
                    <h3 className="text-xl font-black text-indigo-950 uppercase">Tabela Logística</h3>
                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Configuração base de fretes</p>
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-indigo-400 uppercase ml-2">Taxa Base (Saída)</label>
                    <input type="number" className="w-full bg-indigo-50/30 border border-indigo-100 rounded-2xl p-4 font-black text-indigo-950" value={paymentSettings.pricing.baseFee} onChange={e => handleUpdateGeneralPricing('baseFee', parseFloat(e.target.value))} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-indigo-400 uppercase ml-2">Preço por KM</label>
                    <input type="number" className="w-full bg-indigo-50/30 border border-indigo-100 rounded-2xl p-4 font-black text-indigo-950" value={paymentSettings.pricing.perKmRate} onChange={e => handleUpdateGeneralPricing('perKmRate', parseFloat(e.target.value))} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-indigo-400 uppercase ml-2">Mínimo</label>
                    <input type="number" className="w-full bg-indigo-50/30 border border-indigo-100 rounded-2xl p-4 font-black text-indigo-950" value={paymentSettings.pricing.minFare} onChange={e => handleUpdateGeneralPricing('minFare', parseFloat(e.target.value))} />
                 </div>
              </div>
           </div>

           {/* Catálogo */}
           <div className="bg-white p-10 rounded-[3rem] border border-indigo-50 shadow-sm space-y-8">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center text-xl">🛒</div>
                 <div>
                    <h3 className="text-xl font-black text-indigo-950 uppercase">Catálogo Duarte Cash</h3>
                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Crie pacotes de créditos informando seu próprio link de pagamento externo</p>
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-green-50/30 p-8 rounded-[2rem] border border-green-100">
                 <div className="md:col-span-3 space-y-1">
                    <label className="text-[9px] font-black text-indigo-400 uppercase">Nome do Pacote</label>
                    <input className="w-full bg-white border border-indigo-100 rounded-xl p-4 font-bold" value={newTopUpProduct.name} onChange={e => setNewTopUpProduct({...newTopUpProduct, name: e.target.value})} placeholder="Ex: Pacote Ouro" />
                 </div>
                 <div className="md:col-span-2 space-y-1">
                    <label className="text-[9px] font-black text-indigo-400 uppercase">Valor (R$)</label>
                    <input type="number" className="w-full bg-white border border-indigo-100 rounded-xl p-4 font-bold" value={newTopUpProduct.amount || ''} onChange={e => setNewTopUpProduct({...newTopUpProduct, amount: parseFloat(e.target.value)})} placeholder="100.00" />
                 </div>
                 <div className="md:col-span-5 space-y-1">
                    <label className="text-[9px] font-black text-indigo-400 uppercase">Link de Pagamento Externo (Sua URL)</label>
                    <input className="w-full bg-white border border-indigo-100 rounded-xl p-4 font-bold text-xs" value={newTopUpProduct.purchaseLink} onChange={e => setNewTopUpProduct({...newTopUpProduct, purchaseLink: e.target.value})} placeholder="https://seu-link-de-pagamento.com/..." />
                 </div>
                 <div className="md:col-span-2">
                    <button onClick={handleAddTopUpProduct} className="w-full bg-green-600 text-white py-4 rounded-xl font-black uppercase text-[10px] shadow-lg">Adicionar e Salvar</button>
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {(paymentSettings.pricing.topUpProducts || []).map(product => (
                    <div key={product.id} className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100 flex justify-between items-center group relative">
                       <div className="overflow-hidden">
                          <p className="font-black text-indigo-950 text-xs uppercase truncate">{product.name}</p>
                          <p className="text-sm font-black text-green-600 tracking-tighter">R$ {product.amount.toFixed(2)}</p>
                          <p className="text-[8px] text-indigo-300 truncate mt-1">{product.purchaseLink}</p>
                       </div>
                       <button onClick={() => handleRemoveTopUpProduct(product.id)} className="text-red-300 hover:text-red-500 transition-colors">
                          <TrashIcon />
                       </button>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {tab === 'CRM' && (
        <div className="space-y-8 animate-in fade-in duration-300">
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <div className="bg-indigo-950 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] text-white shadow-xl sm:col-span-2 border border-white/5 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/10 rounded-full blur-3xl -mr-24 -mt-24"></div>
                 <p className="text-[9px] md:text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">Faturamento Rede Duarte</p>
                 <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-green-400">R$ {orders.filter(o => o.status === OrderStatus.COMPLETED).reduce((acc, o) => acc + o.total, 0).toFixed(2)}</h2>
                 <div className="mt-4 flex items-center gap-2 text-indigo-300/60">
                    <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-[8px] font-bold uppercase tracking-widest">Atualizado em tempo real</p>
                 </div>
              </div>
              <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-indigo-50 shadow-sm text-center flex flex-col justify-center">
                 <p className="text-[9px] md:text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">Lojistas</p>
                 <p className="text-2xl md:text-3xl font-black text-indigo-950">{users.filter(u => u.role === UserRole.MERCHANT).length}</p>
              </div>
              <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-indigo-50 shadow-sm text-center flex flex-col justify-center">
                 <p className="text-[9px] md:text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">Entregadores</p>
                 <p className="text-2xl md:text-3xl font-black text-indigo-950">{users.filter(u => u.role === UserRole.DRIVER).length}</p>
              </div>
           </div>
        </div>
      )}

      {tab === 'USERS' && (
        <div className="bg-white p-10 rounded-[4rem] border border-indigo-50 shadow-sm space-y-8 animate-in slide-in-from-left duration-500">
           <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <h2 className="text-2xl font-black text-indigo-950 uppercase">Base de Usuários</h2>
              <div className="flex bg-indigo-50 p-1.5 rounded-2xl">
                 <button onClick={() => setUserFilter('ALL')} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${userFilter === 'ALL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-indigo-300'}`}>Todos</button>
                 <button onClick={() => setUserFilter(UserStatus.ACTIVE)} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${userFilter === UserStatus.ACTIVE ? 'bg-white text-indigo-600 shadow-sm' : 'text-indigo-300'}`}>Ativos</button>
              </div>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="border-b border-indigo-50 text-[10px] font-black text-indigo-300 uppercase tracking-widest">
                       <th className="pb-4">Usuário</th>
                       <th className="pb-4">Cargo</th>
                       <th className="pb-4">Status</th>
                       <th className="pb-4 text-right">Ações</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-indigo-50">
                    {filteredUsers.map(u => (
                       <tr key={u.id} className="hover:bg-indigo-50/20">
                          <td className="py-4">
                             <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center font-black text-indigo-600 uppercase">{u.name[0]}</div>
                                <div><p className="font-bold text-indigo-950">{u.name}</p><p className="text-[10px] text-indigo-300">{u.email}</p></div>
                             </div>
                          </td>
                          <td className="py-4">
                             <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-tighter">{u.role}</span>
                          </td>
                          <td className="py-4">
                             <span className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest ${u.status === UserStatus.ACTIVE ? 'text-green-600' : 'text-red-400'}`}>
                                <div className={`w-2 h-2 rounded-full ${u.status === UserStatus.ACTIVE ? 'bg-green-500' : 'bg-red-400'}`}></div> {u.status}
                             </span>
                          </td>
                          <td className="py-4 text-right">
                             <div className="flex justify-end gap-3 items-center">
                                <button onClick={() => openEditUser(u)} className="text-[10px] font-black uppercase text-indigo-600">Editar</button>
                                <button onClick={() => handleToggleUserStatus(u.id, u.status)} className="text-[10px] font-black uppercase text-indigo-400">Status</button>
                                <button onClick={() => onDeleteUser(u.id)} className="text-red-300 hover:text-red-500"><TrashIcon /></button>
                             </div>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminView;

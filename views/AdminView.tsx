
import React, { useEffect, useState } from 'react';
import { Order, OrderStatus, ApiSettings, PaymentMethod, User, UserRole, UserStatus } from '../types';
import { geminiService } from '../services/geminiService';

interface AdminViewProps {
  orders: Order[];
  users: User[];
  onAddUser: (user: User) => void;
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
  onDeleteUser: (userId: string) => void;
}

const AdminView: React.FC<AdminViewProps> = ({ orders, users, onAddUser, onUpdateUser, onDeleteUser }) => {
  const [tab, setTab] = useState<'DASHBOARD' | 'PAYMENTS' | 'USERS'>('DASHBOARD');
  const [insight, setInsight] = useState('Analisando ecossistema...');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [userFormData, setUserFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    password: '',
    phone: '',
    vehiclePlate: '',
    role: UserRole.USER,
    document: '',
    status: UserStatus.ACTIVE
  });
  
  const [securityReview, setSecurityReview] = useState<string | null>(null);

  const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0);
  const deliveredCount = orders.filter(o => o.status === OrderStatus.DELIVERED || o.status === OrderStatus.COMPLETED).length;

  useEffect(() => {
    const fetchInsight = async () => {
      const res = await geminiService.getAdminInsights(totalRevenue, users.length);
      setInsight(res || '');
    };
    fetchInsight();
  }, [totalRevenue, users.length]);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setUserFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      vehiclePlate: '',
      role: UserRole.USER,
      document: '',
      status: UserStatus.ACTIVE
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setUserFormData({ ...user });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.name || !userFormData.email || !userFormData.password) {
      alert("Nome, E-mail e Senha são obrigatórios.");
      return;
    }

    if (editingUser) {
      onUpdateUser(editingUser.id, userFormData);
    } else {
      const userToSave: User = {
        id: `USR-${Date.now()}`,
        name: userFormData.name!,
        email: userFormData.email!,
        password: userFormData.password!,
        phone: userFormData.phone!,
        vehiclePlate: userFormData.role === UserRole.DRIVER ? userFormData.vehiclePlate : undefined,
        role: userFormData.role as UserRole,
        status: userFormData.status as UserStatus,
        document: userFormData.document,
        createdAt: new Date().toISOString(),
      };
      onAddUser(userToSave);
      
      const review = await geminiService.getProfileSecurityReview(userToSave.name, userToSave.role, userToSave.document || 'N/A');
      setSecurityReview(review);
    }
    
    setIsModalOpen(false);
    setTimeout(() => setSecurityReview(null), 10000);
  };

  const getRoleBadge = (role: UserRole) => {
    switch(role) {
      case UserRole.ADMIN: return 'bg-purple-100 text-purple-700';
      case UserRole.DRIVER: return 'bg-blue-100 text-blue-700';
      case UserRole.MERCHANT: return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Administração Delivora</h1>
          <div className="flex gap-4 mt-2">
            {[
              { id: 'DASHBOARD', label: 'Painel' },
              { id: 'USERS', label: 'Usuários' },
              { id: 'PAYMENTS', label: 'Configurações' }
            ].map((t) => (
              <button 
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={`text-sm font-bold pb-1 border-b-2 transition-all ${tab === t.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        {tab === 'USERS' && (
          <button 
            onClick={handleOpenCreate}
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
          >
            <span>+</span> Novo Cadastro
          </button>
        )}
      </header>

      {securityReview && (
        <div className="bg-indigo-900 text-white p-4 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top duration-500 flex items-center gap-3">
          <span className="text-xl">🛡️</span>
          <div>
            <p className="text-[10px] font-bold uppercase opacity-60">Auditoria de Segurança (AI)</p>
            <p className="text-sm">{securityReview}</p>
          </div>
        </div>
      )}

      {tab === 'DASHBOARD' && (
        <>
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-3xl shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Relatório Estratégico</h3>
            <p className="text-xl font-medium leading-relaxed">"{insight}"</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-gray-400 text-sm uppercase font-bold">Receita</p>
              <p className="text-3xl font-black">R$ {totalRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-gray-400 text-sm uppercase font-bold">Usuários</p>
              <p className="text-3xl font-black text-indigo-600">{users.length}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-gray-400 text-sm uppercase font-bold">Pedidos</p>
              <p className="text-3xl font-black text-orange-600">{orders.length}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-gray-400 text-sm uppercase font-bold">Entregas</p>
              <p className="text-3xl font-black text-green-600">{deliveredCount}</p>
            </div>
          </div>
        </>
      )}

      {tab === 'USERS' && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-500">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Usuário</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Função</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Veículo</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500">
                        {user.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${getRoleBadge(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {user.role === UserRole.DRIVER ? (user.vehiclePlate || 'N/D') : '---'}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => handleOpenEdit(user)}
                      className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded-lg transition-colors"
                    >
                      Editar / Trocar Senha
                    </button>
                    <button 
                      onClick={() => onDeleteUser(user.id)}
                      className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1 rounded-lg transition-colors"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Cadastro / Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-black text-xl">{editingUser ? 'Editar Usuário' : 'Novo Cadastro'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto max-h-[80vh]">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Informações Básicas</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Nome Completo</label>
                    <input required value={userFormData.name} onChange={e => setUserFormData({...userFormData, name: e.target.value})} className="w-full bg-gray-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Telefone / Celular</label>
                    <input required value={userFormData.phone} onChange={e => setUserFormData({...userFormData, phone: e.target.value})} placeholder="(00) 00000-0000" className="w-full bg-gray-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Credenciais de Acesso</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">E-mail (Login)</label>
                    <input required type="email" value={userFormData.email} onChange={e => setUserFormData({...userFormData, email: e.target.value})} className="w-full bg-gray-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Senha</label>
                    <input required type="text" value={userFormData.password} onChange={e => setUserFormData({...userFormData, password: e.target.value})} placeholder="Defina a senha" className="w-full bg-white border border-indigo-100 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Configuração de Perfil</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Função</label>
                    <select disabled={!!editingUser} value={userFormData.role} onChange={e => setUserFormData({...userFormData, role: e.target.value as UserRole})} className="w-full bg-gray-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none">
                      <option value={UserRole.USER}>Cliente</option>
                      <option value={UserRole.MERCHANT}>Lojista</option>
                      <option value={UserRole.DRIVER}>Entregador</option>
                      <option value={UserRole.ADMIN}>Administrador</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Status</label>
                    <select value={userFormData.status} onChange={e => setUserFormData({...userFormData, status: e.target.value as UserStatus})} className="w-full bg-gray-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none">
                      <option value={UserStatus.ACTIVE}>Ativo</option>
                      <option value={UserStatus.INACTIVE}>Inativo</option>
                    </select>
                  </div>
                </div>
                {userFormData.role === UserRole.DRIVER && (
                  <div className="animate-in slide-in-from-right">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Placa do Veículo</label>
                    <input required value={userFormData.vehiclePlate} onChange={e => setUserFormData({...userFormData, vehiclePlate: e.target.value})} placeholder="ABC-1234" className="w-full bg-orange-50 border border-orange-100 rounded-2xl p-4" />
                  </div>
                )}
              </div>

              <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-700 transition-all active:scale-95">
                {editingUser ? 'Salvar Alterações' : 'Criar Acesso'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminView;

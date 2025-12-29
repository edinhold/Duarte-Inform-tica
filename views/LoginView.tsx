
import React, { useState } from 'react';
import { User, UserRole, UserStatus } from '../types';

interface LoginViewProps {
  onLogin: (user: User) => void;
  onAdminAccess: () => void;
  availableUsers: User[];
  onRegister?: (user: User) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, onAdminAccess, availableUsers, onRegister }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [regRole, setRegRole] = useState<UserRole>(UserRole.USER);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Estados do Cadastro
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    document: '',
    shopName: '',
    vehiclePlate: '',
    vehicleModel: '',
    vehicleColor: '',
    vehicleType: 'CAR' as 'CAR' | 'MOTORCYCLE'
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      const user = availableUsers.find(u => u.email === email && u.password === password);
      if (user) {
        if (user.role === UserRole.ADMIN) {
          setError('Acesso negado. Administradores devem usar o portal específico.');
        } else {
          onLogin(user);
        }
      } else {
        setError('E-mail ou senha incorretos. Tente novamente.');
      }
      setIsLoading(false);
    }, 800);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const newUser: User = {
      id: `U${Math.floor(Math.random() * 10000)}`,
      email,
      password,
      name: regRole === UserRole.MERCHANT ? formData.shopName : formData.name,
      address: formData.address,
      phone: formData.phone,
      document: formData.document,
      role: regRole,
      status: UserStatus.ACTIVE,
      createdAt: new Date().toISOString(),
      walletBalance: 0,
      shopName: regRole === UserRole.MERCHANT ? formData.shopName : undefined,
      vehiclePlate: regRole === UserRole.DRIVER ? formData.vehiclePlate : undefined,
      vehicleModel: regRole === UserRole.DRIVER ? formData.vehicleModel : undefined,
      vehicleColor: regRole === UserRole.DRIVER ? formData.vehicleColor : undefined,
      vehicleType: regRole === UserRole.DRIVER ? formData.vehicleType : undefined,
    };

    setTimeout(() => {
      if (onRegister) onRegister(newUser);
      onLogin(newUser);
      setIsLoading(false);
    }, 1000);
  };

  if (isRegistering) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-indigo-50/50">
        <div className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden p-8 md:p-12 animate-in zoom-in duration-500 border border-indigo-100">
          <div className="flex justify-between items-center mb-8">
            <button onClick={() => setIsRegistering(false)} className="text-indigo-400 font-bold text-sm hover:text-indigo-600 transition-colors">← Voltar para Login</button>
            <h2 className="text-2xl font-black text-indigo-950">Criar Conta</h2>
          </div>

          <div className="flex bg-indigo-50 p-1.5 rounded-2xl mb-8">
            {[
              { id: UserRole.USER, label: 'Cliente' },
              { id: UserRole.DRIVER, label: 'Motorista' },
              { id: UserRole.MERCHANT, label: 'Lojista' }
            ].map(role => (
              <button
                key={role.id}
                onClick={() => setRegRole(role.id as UserRole)}
                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${regRole === role.id ? 'bg-white shadow-sm text-indigo-600' : 'text-indigo-400'}`}
              >
                {role.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
               <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1 ml-2">
                 {regRole === UserRole.MERCHANT ? 'Nome da Loja' : 'Nome Completo'}
               </label>
               <input required value={regRole === UserRole.MERCHANT ? formData.shopName : formData.name} onChange={e => setFormData({...formData, [regRole === UserRole.MERCHANT ? 'shopName' : 'name']: e.target.value})} className="w-full bg-indigo-50/30 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-200 transition-all" placeholder="Ex: João Duarte" />
            </div>

            <div className="md:col-span-2">
               <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1 ml-2">Endereço Completo</label>
               <input required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-indigo-50/30 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-200 transition-all" placeholder="Rua, Número, Bairro, Cidade" />
            </div>

            <div>
               <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1 ml-2">Telefone</label>
               <input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-indigo-50/30 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-200 transition-all" placeholder="(00) 00000-0000" />
            </div>

            <div>
               <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1 ml-2">{regRole === UserRole.MERCHANT ? 'CPF ou CNPJ' : 'CPF'}</label>
               <input required value={formData.document} onChange={e => setFormData({...formData, document: e.target.value})} className="w-full bg-indigo-50/30 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-200 transition-all" placeholder="000.000.000-00" />
            </div>

            <div>
               <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1 ml-2">E-mail</label>
               <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-indigo-50/30 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-200 transition-all" placeholder="seu@email.com" />
            </div>

            <div>
               <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1 ml-2">Senha</label>
               <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-indigo-50/30 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-200 transition-all" placeholder="••••••••" />
            </div>

            {regRole === UserRole.DRIVER && (
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-6 bg-indigo-50/80 rounded-3xl border border-indigo-100">
                <h4 className="md:col-span-2 text-xs font-black text-indigo-600 uppercase tracking-widest">Informações do Veículo</h4>
                <div>
                   <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Placa</label>
                   <input required value={formData.vehiclePlate} onChange={e => setFormData({...formData, vehiclePlate: e.target.value})} className="w-full bg-white border-0 rounded-2xl p-4" placeholder="ABC-1234" />
                </div>
                <div>
                   <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Modelo</label>
                   <input required value={formData.vehicleModel} onChange={e => setFormData({...formData, vehicleModel: e.target.value})} className="w-full bg-white border-0 rounded-2xl p-4" placeholder="Ex: Honda CG 160" />
                </div>
                <div>
                   <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Cor</label>
                   <input required value={formData.vehicleColor} onChange={e => setFormData({...formData, vehicleColor: e.target.value})} className="w-full bg-white border-0 rounded-2xl p-4" placeholder="Ex: Vermelho" />
                </div>
                <div>
                   <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Tipo</label>
                   <select value={formData.vehicleType} onChange={e => setFormData({...formData, vehicleType: e.target.value as any})} className="w-full bg-white border-0 rounded-2xl p-4 font-bold text-indigo-900">
                      <option value="MOTORCYCLE">Moto</option>
                      <option value="CAR">Carro</option>
                   </select>
                </div>
              </div>
            )}

            <button disabled={isLoading} className="md:col-span-2 mt-6 bg-indigo-600 text-white py-5 rounded-3xl font-black text-lg shadow-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-indigo-100">
              {isLoading ? 'Cadastrando...' : 'Finalizar Cadastro'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-100 via-indigo-50 to-indigo-100">
      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-500 border border-indigo-100">
        <div className="p-10 md:p-12 space-y-8">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-indigo-200 mx-auto mb-6">D</div>
            <h1 className="text-3xl font-black text-indigo-950 tracking-tight">Duarte Delivery</h1>
            <p className="text-indigo-300 text-sm font-medium">Entregas inteligentes para você.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-1 ml-2">E-mail</label>
                <input 
                  type="email" 
                  required
                  placeholder="exemplo@email.com"
                  className="w-full bg-indigo-50/30 border-0 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-indigo-200 transition-all font-medium text-indigo-900"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-1 ml-2">Senha</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full bg-indigo-50/30 border-0 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-indigo-200 transition-all font-medium text-indigo-900"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold animate-in fade-in duration-300 border border-red-100">
                ⚠️ {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className={`w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-2xl shadow-indigo-100 transition-all flex items-center justify-center gap-3 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-indigo-700 active:scale-95'}`}
            >
              {isLoading ? 'Autenticando...' : 'Entrar'}
            </button>
          </form>

          <div className="text-center space-y-4">
             <button onClick={() => setIsRegistering(true)} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors">Ainda não tem conta? Cadastre-se</button>
             <div className="pt-4 border-t border-indigo-50">
               <button onClick={onAdminAccess} className="text-[10px] font-bold text-indigo-200 hover:text-indigo-400 transition-colors uppercase tracking-widest">
                 🔒 Acesso Administrativo
               </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;

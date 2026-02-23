
import React, { useState } from 'react';
import { User, UserRole, UserStatus } from '../types';

interface SetupWizardViewProps {
  onComplete: (superUser: User) => void;
}

const SetupWizardView: React.FC<SetupWizardViewProps> = ({ onComplete }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    recoveryEmail: '',
    document: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (formData.password.length < 8) {
      setError('A senha mestre deve ter pelo menos 8 caracteres.');
      return;
    }

    const superUser: User = {
      id: 'SA-ROOT',
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      document: formData.document,
      createdAt: new Date().toISOString(),
      walletBalance: 0,
      needsPasswordChange: false // Já está definindo agora
    };

    onComplete(superUser);
  };

  return (
    <div className="min-h-screen bg-indigo-950 flex items-center justify-center p-6 font-sans">
      <div className="max-w-xl w-full bg-white rounded-[4rem] p-12 shadow-2xl space-y-8 animate-in zoom-in duration-700">
        <div className="text-center space-y-3">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white text-4xl mx-auto shadow-2xl shadow-indigo-500/20 mb-6">👑</div>
          <h1 className="text-3xl font-black text-indigo-950 tracking-tight">Duarte Core Setup</h1>
          <p className="text-indigo-400 text-sm font-bold uppercase tracking-widest">Configuração Inicial de Super Usuário</p>
          <div className="h-1 w-20 bg-indigo-100 mx-auto rounded-full"></div>
        </div>

        <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
           <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">Atenção</p>
           <p className="text-xs text-amber-600 leading-relaxed">Este é o setup único do sistema. O usuário criado aqui terá controle total sobre toda a rede, lojistas e motoristas.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="md:col-span-2">
                <label className="text-[10px] font-black text-indigo-300 uppercase block mb-1 ml-2">Nome do Administrador Root</label>
                <input required className="w-full bg-indigo-50/50 border-0 rounded-2xl p-4 text-indigo-900 font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Admin Master" />
             </div>
             <div>
                <label className="text-[10px] font-black text-indigo-300 uppercase block mb-1 ml-2">E-mail Principal</label>
                <input required type="email" className="w-full bg-indigo-50/50 border-0 rounded-2xl p-4 text-indigo-900 font-bold" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="admin@duarte.com" />
             </div>
             <div>
                <label className="text-[10px] font-black text-indigo-300 uppercase block mb-1 ml-2">CPF/Documento</label>
                <input required className="w-full bg-indigo-50/50 border-0 rounded-2xl p-4 text-indigo-900 font-bold" value={formData.document} onChange={e => setFormData({...formData, document: e.target.value})} placeholder="000.000.000-00" />
             </div>
             <div>
                <label className="text-[10px] font-black text-indigo-300 uppercase block mb-1 ml-2">Senha Mestre</label>
                <input required type="password" className="w-full bg-indigo-50/50 border-0 rounded-2xl p-4 text-indigo-900 font-bold" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
             </div>
             <div>
                <label className="text-[10px] font-black text-indigo-300 uppercase block mb-1 ml-2">Confirmar Senha</label>
                <input required type="password" className="w-full bg-indigo-50/50 border-0 rounded-2xl p-4 text-indigo-900 font-bold" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} placeholder="••••••••" />
             </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] font-black uppercase text-center border border-red-100">
               {error}
            </div>
          )}

          <button type="submit" className="w-full bg-indigo-950 text-white py-6 rounded-3xl font-black text-lg shadow-2xl hover:bg-black transition-all uppercase tracking-widest mt-4">
             Finalizar e Ativar Sistema
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetupWizardView;

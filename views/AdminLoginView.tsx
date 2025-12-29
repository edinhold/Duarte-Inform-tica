
import React, { useState } from 'react';
import { User, UserRole } from '../types';

interface AdminLoginViewProps {
  onLogin: (user: User) => void;
  onBack: () => void;
  availableUsers: User[];
}

const AdminLoginView: React.FC<AdminLoginViewProps> = ({ onLogin, onBack, availableUsers }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      const user = availableUsers.find(u => 
        u.email === email && 
        u.password === password && 
        [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(u.role)
      );
      
      if (user) {
        onLogin(user);
      } else {
        setError('Credenciais administrativas inválidas.');
      }
      setIsLoading(false);
    }, 1200);
  };

  const handleQuickLogin = () => {
    setEmail('admin@duartedelivery.com');
    setPassword('123456');
    // Forçar um pequeno delay para feedback visual de preenchimento
    setTimeout(() => {
      setIsLoading(true);
      setTimeout(() => {
        const user = availableUsers.find(u => u.email === 'admin@duartedelivery.com' && u.password === '123456');
        if (user) onLogin(user);
        setIsLoading(false);
      }, 800);
    }, 200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-indigo-950">
      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500 border border-indigo-900/50">
        <div className="p-10 md:p-12 space-y-8">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-indigo-950 rounded-3xl flex items-center justify-center text-white font-black text-3xl shadow-xl mx-auto mb-6 border-4 border-indigo-500/20">D</div>
            <h1 className="text-2xl font-black text-indigo-950 tracking-tight uppercase">Portal Administrativo</h1>
            <p className="text-indigo-300 text-[10px] font-bold tracking-widest uppercase">REDE DUARTE DELIVERY</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <label className="block text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-1 ml-2">Identificação de Duarte</label>
                <input 
                  type="email" 
                  required
                  placeholder="admin@duartedelivery.com"
                  className="w-full bg-indigo-50/50 border border-indigo-100 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-indigo-900"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div className="relative">
                <label className="block text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-1 ml-2">Chave de Segurança</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full bg-indigo-50/50 border border-indigo-100 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-indigo-500/10 transition-all font-mono text-indigo-900"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] font-black uppercase text-center border border-red-100 animate-pulse">
                Acesso Negado: {error}
              </div>
            )}

            <div className="space-y-3">
              <button 
                type="submit"
                disabled={isLoading}
                className={`w-full bg-indigo-950 text-white py-5 rounded-2xl font-black text-lg shadow-xl transition-all flex items-center justify-center gap-3 ${isLoading ? 'opacity-70' : 'hover:bg-black active:scale-95 shadow-indigo-900/20'}`}
              >
                {isLoading ? 'Sincronizando...' : 'Entrar no Sistema'}
              </button>

              <button 
                type="button"
                onClick={handleQuickLogin}
                className="w-full bg-amber-50 text-amber-600 py-3 rounded-2xl font-black text-xs uppercase tracking-widest border border-amber-100 hover:bg-amber-100 transition-all flex items-center justify-center gap-2"
              >
                ⚡ Acesso Rápido Admin
              </button>
            </div>
          </form>

          <div className="pt-6 text-center">
            <button 
              onClick={onBack}
              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-widest"
            >
              ← Voltar ao Início
            </button>
          </div>
        </div>
      </div>
      
      <div className="fixed bottom-8 text-center w-full">
          <p className="text-[10px] text-indigo-400/50 font-bold uppercase tracking-widest">Duarte Core v5.1-Master</p>
      </div>
    </div>
  );
};

export default AdminLoginView;

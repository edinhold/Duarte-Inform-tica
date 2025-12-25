
import React, { useState } from 'react';
import { User, UserRole } from '../types';

interface LoginViewProps {
  onLogin: (user: User) => void;
  availableUsers: User[];
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, availableUsers }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulação de delay de rede
    setTimeout(() => {
      const user = availableUsers.find(u => u.email === email && u.password === password);
      
      if (user) {
        onLogin(user);
      } else {
        setError('E-mail ou senha incorretos. Tente novamente.');
      }
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 to-orange-50">
      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-500">
        <div className="p-10 md:p-12 space-y-8">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-indigo-100 mx-auto mb-6">D</div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Bem-vindo à Delivora</h1>
            <p className="text-gray-400 text-sm">Entre com suas credenciais para continuar</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-2">E-mail</label>
                <input 
                  type="email" 
                  required
                  placeholder="exemplo@email.com"
                  className="w-full bg-gray-50 border-0 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-2">Senha</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full bg-gray-50 border-0 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold animate-in fade-in slide-in-from-top duration-300">
                ⚠️ {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className={`w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-2xl shadow-indigo-100 transition-all flex items-center justify-center gap-3 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-indigo-700 active:scale-95'}`}
            >
              {isLoading ? 'Autenticando...' : 'Entrar no Sistema'}
            </button>
          </form>

          <div className="pt-6 border-t border-gray-50">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center mb-4">Acesso rápido para testes:</p>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => { setEmail('carlos@email.com'); setPassword('user123'); }}
                className="text-[10px] bg-gray-50 text-gray-500 py-2 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              >
                Usuário Teste
              </button>
              <button 
                onClick={() => { setEmail('contato@burgergalaxy.com'); setPassword('merchant123'); }}
                className="text-[10px] bg-gray-50 text-gray-500 py-2 rounded-xl hover:bg-orange-50 hover:text-orange-600 transition-colors"
              >
                Lojista Teste
              </button>
              <button 
                onClick={() => { setEmail('ricardo.driver@email.com'); setPassword('driver123'); }}
                className="text-[10px] bg-gray-50 text-gray-500 py-2 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                Motorista Teste
              </button>
              <button 
                onClick={() => { setEmail('admin@delivora.com'); setPassword('admin123'); }}
                className="text-[10px] bg-gray-50 text-gray-500 py-2 rounded-xl hover:bg-purple-50 hover:text-purple-600 transition-colors"
              >
                Administrador
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;


import React, { useState } from 'react';
import { User, UserRole } from '../types';

interface AdminLoginViewProps {
  onLogin: (user: User) => void;
  onBack: () => void;
  availableUsers: User[];
  onResetPassword: (email: string, newPass: string) => void;
}

const AdminLoginView: React.FC<AdminLoginViewProps> = ({ onLogin, onBack, availableUsers, onResetPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  
  // Estados de recuperação
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryStep, setRecoveryStep] = useState<'EMAIL' | 'CODE' | 'NEW_PASS'>('EMAIL');
  const [newPass, setNewPass] = useState('');

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

  const handleRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    if (recoveryStep === 'EMAIL') {
      const exists = availableUsers.some(u => u.email === recoveryEmail && [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(u.role));
      if (!exists) return alert("E-mail não encontrado na base administrativa.");
      setRecoveryStep('CODE');
    } else if (recoveryStep === 'CODE') {
      setRecoveryStep('NEW_PASS');
    } else {
      onResetPassword(recoveryEmail, newPass);
      alert("Senha redefinida com sucesso!");
      setShowRecovery(false);
      setRecoveryStep('EMAIL');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-indigo-950">
      {/* Modal de Recuperação */}
      {showRecovery && (
        <div className="fixed inset-0 bg-indigo-950/90 backdrop-blur-md z-[200] flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-in zoom-in duration-300">
              <div className="text-center space-y-4 mb-8">
                 <div className="text-4xl">🔑</div>
                 <h3 className="text-2xl font-black text-indigo-950">Recuperar Acesso</h3>
                 <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest">Portal Administrativo Duarte</p>
              </div>

              <form onSubmit={handleRecovery} className="space-y-6">
                 {recoveryStep === 'EMAIL' && (
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block ml-2">E-mail de Cadastro</label>
                       <input required type="email" className="w-full bg-indigo-50 border-0 rounded-2xl p-5" placeholder="admin@duartedelivery.com" value={recoveryEmail} onChange={e => setRecoveryEmail(e.target.value)} />
                       <p className="text-[10px] text-indigo-300 italic text-center">Enviaremos um código de verificação para este e-mail.</p>
                    </div>
                 )}

                 {recoveryStep === 'CODE' && (
                    <div className="space-y-2 text-center">
                       <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-4">Insira o código enviado para seu e-mail</label>
                       <div className="flex justify-center gap-2">
                          {[1,2,3,4].map(i => <div key={i} className="w-12 h-14 bg-indigo-50 rounded-xl border-2 border-indigo-100 flex items-center justify-center font-black text-xl text-indigo-900">0</div>)}
                       </div>
                       <p className="text-[10px] text-indigo-300 italic mt-4">Simulação Duarte: Apenas clique em continuar.</p>
                    </div>
                 )}

                 {recoveryStep === 'NEW_PASS' && (
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block ml-2">Nova Senha Mestre</label>
                       <input required type="password" className="w-full bg-indigo-50 border-0 rounded-2xl p-5" placeholder="••••••••" value={newPass} onChange={e => setNewPass(e.target.value)} />
                    </div>
                 )}

                 <button type="submit" className="w-full bg-indigo-950 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:bg-black transition-all">
                    {recoveryStep === 'EMAIL' ? 'Enviar Código' : recoveryStep === 'CODE' ? 'Verificar Código' : 'Redefinir Senha'}
                 </button>
                 <button type="button" onClick={() => setShowRecovery(false)} className="w-full text-[10px] font-black text-indigo-300 uppercase tracking-widest hover:text-indigo-600 transition-colors">Cancelar</button>
              </form>
           </div>
        </div>
      )}

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
                <div className="flex justify-between items-center mb-1 ml-2">
                   <label className="block text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Chave de Segurança</label>
                   <button type="button" onClick={() => setShowRecovery(true)} className="text-[9px] font-black text-indigo-600 uppercase hover:underline">Esqueci a chave</button>
                </div>
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
          <p className="text-[10px] text-indigo-400/50 font-bold uppercase tracking-widest">Duarte Core v5.2-Master</p>
      </div>
    </div>
  );
};

export default AdminLoginView;

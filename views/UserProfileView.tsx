
import React, { useState } from 'react';
import { User } from '../types';

interface UserProfileViewProps {
  user: User;
  onUpdate: (userId: string, updates: Partial<User>) => void;
  onBack: () => void;
}

const UserProfileView: React.FC<UserProfileViewProps> = ({ user, onUpdate, onBack }) => {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    address: user.address || '',
    document: user.document || '',
    whatsapp: user.whatsapp || ''
  });
  
  const [showPassModal, setShowPassModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      onUpdate(user.id, formData);
      setIsSaving(false);
      alert("Perfil atualizado!");
    }, 800);
  };

  const handleUpdatePassword = () => {
    if (!newPassword.trim() || newPassword.length < 6) return alert("A senha deve ter pelo menos 6 dígitos.");
    onUpdate(user.id, { password: newPassword });
    alert("Sua senha foi alterada com sucesso!");
    setShowPassModal(false);
    setNewPassword('');
  };

  return (
    <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom duration-500 pb-20">
      
      {/* Modal de Troca de Senha */}
      {showPassModal && (
        <div className="fixed inset-0 bg-indigo-950/90 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl animate-in zoom-in duration-300">
              <h3 className="text-xl font-black text-indigo-950 mb-6">Alterar Minha Senha</h3>
              <div className="space-y-4 mb-8">
                 <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest block ml-2">Nova Senha</label>
                 <input 
                    type="password" 
                    className="w-full bg-indigo-50 border-0 rounded-2xl p-5 font-bold" 
                    placeholder="••••••••" 
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                 />
              </div>
              <button onClick={handleUpdatePassword} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl mb-4">Atualizar Senha</button>
              <button onClick={() => setShowPassModal(false)} className="w-full text-indigo-300 text-[10px] font-black uppercase tracking-widest">Cancelar</button>
           </div>
        </div>
      )}

      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-indigo-400 hover:text-indigo-600 shadow-sm border border-indigo-50 transition-all">←</button>
          <div>
            <h1 className="text-2xl font-black text-indigo-950">Meu Perfil</h1>
            <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">Controle total da sua conta Duarte</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-indigo-50 text-center">
            <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black mx-auto mb-4 shadow-xl">
              {user.name[0]}
            </div>
            <h2 className="font-black text-indigo-950 text-xl">{user.name}</h2>
            <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase mt-2 tracking-widest">
              {user.role}
            </span>
          </div>

          <div className="bg-indigo-950 text-white p-8 rounded-[3rem] shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-4">Segurança Duarte</h3>
            <p className="text-[10px] leading-relaxed opacity-60 font-bold uppercase">Sua senha é pessoal e intransferível. Recomendamos trocá-la periodicamente.</p>
            <button onClick={() => setShowPassModal(true)} className="w-full bg-white/10 hover:bg-white/20 mt-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Trocar Senha Agora</button>
          </div>
        </div>

        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[4rem] shadow-sm border border-indigo-50 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2 ml-2">Nome Completo</label>
                <input 
                  required
                  className="w-full bg-indigo-50/30 border-0 rounded-2xl p-4 font-bold text-indigo-900"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2 ml-2">E-mail</label>
                <input 
                  required
                  type="email"
                  className="w-full bg-indigo-50/30 border-0 rounded-2xl p-4 font-bold text-indigo-900"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2 ml-2">Telefone</label>
                <input 
                  className="w-full bg-indigo-50/30 border-0 rounded-2xl p-4 font-bold text-indigo-900"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2 ml-2">Endereço de Entrega</label>
                <textarea 
                  className="w-full bg-indigo-50/30 border-0 rounded-2xl p-4 font-bold text-indigo-900 min-h-[100px]"
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSaving}
              className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all"
            >
              {isSaving ? 'Processando...' : 'Salvar Alterações do Perfil'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfileView;

import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface LoginProps {
  onLoginSuccess: (user: { username: string; role: string; name: string; job: string; avatar: string }) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  const userDatabase: Record<string, { role: string; name: string; job: string; avatar: string; pass: string }> = {
    "admin.geral": { role: "Administrador", name: "Maurício Albuquerque", job: "Gestor Master & Arquiteto", avatar: "MA", pass: "12345678901" },
    "reginaldo.silveira": { role: "Colaborador", name: "Reginaldo Silveira", job: "Zelador Geral", avatar: "RS", pass: "22233344455" },
    "carlos.silva": { role: "Morador", name: "Carlos Henrique Silva", job: "Morador Proprietário", avatar: "CS", pass: "33344455566" },
    "jose.portaria": { role: "Portaria", name: "José Portaria", job: "Supervisor Portaria", avatar: "JP", pass: "44455566677" }
  };

  const handlePresetClick = (userKey: string, pass: string) => {
    setUsername(userKey);
    setPassword(pass);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim().replace(/\D/g, ''); // Extract only numbers

    // Authority Tier 1: Check hardcoded preset userDatabase
    const user = userDatabase[cleanUsername];
    if (user && user.pass.replace(/\D/g, '') === cleanPassword) {
      onLoginSuccess({ username: cleanUsername, ...user });
      return;
    }

    // Authority Tier 2: Check Supabase Cloud Database live users table
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', cleanUsername)
        .single();

      if (!error && data) {
        const cleanDbCpf = (data.cpf || "").replace(/\D/g, '');
        if (cleanDbCpf === cleanPassword) {
          onLoginSuccess({
            username: cleanUsername,
            role: cleanUsername.includes('admin') ? 'Administrador' : 'Colaborador',
            name: data.full_name,
            job: 'Membro Credenciado',
            avatar: data.full_name.split(' ').map((n: string) => n.charAt(0)).join('').toUpperCase().slice(0, 2)
          });
          return;
        } else {
          alert("Erro: Senha (CPF) incorreta para este usuário.");
          return;
        }
      }
    } catch (err) {
      console.warn("Supabase cloud authentication failed, using offline presets:", err);
    }

    alert("Erro: Credenciais inválidas. Verifique o login e a senha (CPF).");
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-4 z-50 font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 max-w-md w-full shadow-2xl flex flex-col gap-6 text-slate-100">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-blue-900 rounded-xl flex items-center justify-center mx-auto mb-2 border border-blue-500/20 shadow-inner">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-white tracking-widest uppercase">CondoSphere</h2>
          <p className="text-xs text-slate-400">ERP & Governança de Alta Performance</p>
        </div>

        {/* Presets Info Box */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 space-y-2 text-[11px] text-slate-400 select-none">
          <p className="font-bold text-white mb-1">💡 Credenciais de Teste (Clique para preencher):</p>
          <div 
            onClick={() => handlePresetClick("admin.geral", "12345678901")}
            className="flex justify-between border-b border-slate-900 pb-1 cursor-pointer hover:text-white transition-colors"
          >
            <span>🔑 Administrador:</span>
            <span className="font-mono">admin.geral / 12345678901</span>
          </div>
          <div 
            onClick={() => handlePresetClick("reginaldo.silveira", "22233344455")}
            className="flex justify-between border-b border-slate-900 pb-1 cursor-pointer hover:text-white transition-colors"
          >
            <span>👤 Colaborador:</span>
            <span className="font-mono">reginaldo.silveira / 22233344455</span>
          </div>
          <div 
            onClick={() => handlePresetClick("carlos.silva", "33344455566")}
            className="flex justify-between border-b border-slate-900 pb-1 cursor-pointer hover:text-white transition-colors"
          >
            <span>🏠 Morador:</span>
            <span className="font-mono">carlos.silva / 33344455566</span>
          </div>
          <div 
            onClick={() => handlePresetClick("jose.portaria", "44455566677")}
            className="flex justify-between pb-1 cursor-pointer hover:text-white transition-colors"
          >
            <span>👮 Portaria:</span>
            <span className="font-mono">jose.portaria / 44455566677</span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">Usuário (nome.sobrenome)</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ex: admin.geral"
              className="w-full text-xs bg-slate-950 border border-slate-800 rounded p-3 text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">Senha (CPF - somente números)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ex: 12345678901"
              className="w-full text-xs bg-slate-950 border border-slate-800 rounded p-3 text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-3 rounded text-xs transition-colors uppercase tracking-widest mt-2 shadow-lg"
          >
            Entrar no Sistema
          </button>
        </form>
      </div>
    </div>
  );
};
export default Login;

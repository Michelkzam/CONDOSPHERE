import React, { useState } from 'react';

export const StrategicHR: React.FC = () => {
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  const handleOnboarding = () => {
    if (onboardingCompleted) {
      alert("O onboarding do novo colaborador já foi concluído!");
      return;
    }
    setOnboardingCompleted(true);
    alert("Onboarding de 'Adriano Souza' (Auxiliar de Jardinagem) concluído com sucesso! Registro integrado e sincronizado na folha de pagamento.");
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* 9 Box Potential vs Performance Matrix */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white uppercase">Avaliação de Desempenho (Matriz 9-Box)</h2>
          <p className="text-xs text-slate-400">Mapeamento estratégico e controle de sucessão baseada em Potencial e Desempenho</p>
        </div>

        <div className="grid grid-cols-[80px_1fr] gap-4">
          {/* Y-axis label */}
          <div className="flex flex-col justify-around items-center font-bold text-[10px] text-slate-500 uppercase tracking-widest text-center select-none">
            <span>Alto</span>
            <span>Médio</span>
            <span>Baixo</span>
          </div>

          {/* 3x3 Grid */}
          <div className="grid grid-cols-3 gap-3">
            {/* Row 1 */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 min-h-[90px] flex flex-col justify-between">
              <span className="text-[9px] text-slate-500 font-bold uppercase">Enigma</span>
              <span className="text-xs text-slate-600">-</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 min-h-[90px] flex flex-col justify-between">
              <span className="text-[9px] text-slate-500 font-bold uppercase">Estrela Cadente</span>
              <span className="text-xs text-slate-600">-</span>
            </div>
            <div className="bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/20 min-h-[90px] flex flex-col justify-between shadow-[0_0_10px_rgba(16,185,129,0.05)]">
              <span className="text-[9px] text-emerald-400 font-bold uppercase">Líder / Estrela</span>
              <span className="text-xs text-emerald-400 font-extrabold">⭐️ Ana Maria de Jesus</span>
            </div>

            {/* Row 2 */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 min-h-[90px] flex flex-col justify-between">
              <span className="text-[9px] text-slate-500 font-bold uppercase">Questionável</span>
              <span className="text-xs text-slate-600">-</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 min-h-[90px] flex flex-col justify-between">
              <span className="text-[9px] text-slate-500 font-bold uppercase">Mantenedor</span>
              <span className="text-xs text-slate-300 font-semibold">👤 Reginaldo Silveira</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 min-h-[90px] flex flex-col justify-between">
              <span className="text-[9px] text-slate-500 font-bold uppercase">Alto Desempenho</span>
              <span className="text-xs text-slate-600">-</span>
            </div>

            {/* Row 3 */}
            <div className="bg-red-500/5 p-3 rounded-lg border border-red-500/20 min-h-[90px] flex flex-col justify-between">
              <span className="text-[9px] text-red-400 font-bold uppercase">Insuficiente</span>
              <span className="text-xs text-slate-600">-</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 min-h-[90px] flex flex-col justify-between">
              <span className="text-[9px] text-slate-500 font-bold uppercase">Eficaz</span>
              <span className="text-xs text-slate-600">-</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 min-h-[90px] flex flex-col justify-between">
              <span className="text-[9px] text-slate-500 font-bold uppercase">Especialista</span>
              <span className="text-xs text-slate-600">-</span>
            </div>
          </div>
        </div>

        {/* X-axis label */}
        <div className="grid grid-cols-[80px_1fr] gap-4">
          <div></div>
          <div className="flex justify-around font-bold text-[10px] text-slate-500 uppercase tracking-widest text-center select-none">
            <span>Baixo</span>
            <span>Médio</span>
            <span>Alto</span>
          </div>
        </div>
      </div>

      {/* T&D and Recruitment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* T&D */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white uppercase">Treinamento & Capacitação (T&D)</h3>
            <p className="text-[11px] text-slate-400">Acompanhamento de conformidade de normas obrigatórias e PDIs</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-300">
                <span>NR 35 - Segurança em Altura</span>
                <span className="text-emerald-400 font-bold">100% Concluído</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-300">
                <span>Atendimento e Portaria de Luxo</span>
                <span className="text-blue-400 font-bold">50% Concluído</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: '50%' }}></div>
              </div>
            </div>
          </div>

          <button 
            onClick={() => alert("Central de Treinamento Online iniciada!")}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold py-2 rounded text-xs transition-colors border border-slate-700"
          >
            🎒 Acessar Central de Cursos (T&D)
          </button>
        </div>

        {/* Recruitment / ATS */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase">Recrutamento & Seleção (ATS)</h3>
            <p className="text-[11px] text-slate-400">Monitoramento de vagas abertas e onboarding de recém-admitidos</p>
          </div>

          <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl flex justify-between items-center flex-wrap gap-4">
            <div>
              <h4 className="font-bold text-white text-xs">Auxiliar de Jardinagem Geral</h4>
              <p className="text-[10px] text-slate-500">12 currículos triados | 2 em entrevista</p>
            </div>
            <button
              onClick={handleOnboarding}
              className="bg-emerald-700 hover:bg-emerald-600 text-white font-semibold py-1.5 px-3 rounded text-[11px] transition-colors"
            >
              {onboardingCompleted ? "✓ Concluído" : "Concluir Onboarding"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default StrategicHR;

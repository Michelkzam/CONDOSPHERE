import React from 'react';

export const PeopleAnalytics: React.FC = () => {
  return (
    <div className="space-y-6 text-slate-100">
      {/* Metrics Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">
            Turnover Acumulado (Rotatividade)
          </span>
          <div className="flex justify-between items-baseline">
            <span className="text-2xl font-black text-emerald-400 font-mono">1.2%</span>
            <span className="text-xs text-emerald-500 font-bold">▼ 0.5% (Ideal)</span>
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-1">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '12%' }}></div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">
            Índice de Absenteísmo
          </span>
          <div className="flex justify-between items-baseline">
            <span className="text-2xl font-black text-emerald-400 font-mono">1.4%</span>
            <span className="text-xs text-emerald-500 font-bold">▼ 0.2% (Excelente)</span>
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-1">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '14%' }}></div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">
            Orçamento de Pessoal Utilizado
          </span>
          <div className="flex justify-between items-baseline">
            <span className="text-2xl font-black text-white font-mono">R$ 85k</span>
            <span className="text-xs text-emerald-500 font-bold">92% Utilizado</span>
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-1">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: '92%' }}></div>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-6">
        <div>
          <h2 className="text-base font-bold text-white uppercase select-none">Dashboard Analítico de Força de Trabalho</h2>
          <p className="text-xs text-slate-400">Distribuição financeira mensal e métrica de absenteísmo por trimestre</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SVG Pie Chart */}
          <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">Distribuição Custos de Pessoal</h4>
            <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
              <svg width="100%" height="100%" viewBox="0 0 100 100" className="transform -rotate-90">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#2563eb" strokeWidth="20" strokeDasharray="157 251" strokeDashoffset="0"/>
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10b981" strokeWidth="20" strokeDasharray="94 251" strokeDashoffset="-157"/>
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-sm font-black text-white font-mono">R$ 8,1k</span>
                <span className="text-[8px] text-slate-500 font-bold uppercase">Ao mês</span>
              </div>
            </div>
            <div className="flex justify-center gap-4 text-[10px] text-slate-400 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
                Portaria & Ronda (62.5%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                Zeladoria & Adm (37.5%)
              </span>
            </div>
          </div>

          {/* SVG Bar Chart */}
          <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">Absenteísmo Mensal (%)</h4>
            <div className="w-full max-w-[280px] h-40 mx-auto flex items-end justify-between font-mono pb-2 border-b border-slate-800">
              {/* Bar Jan */}
              <div className="flex flex-col items-center space-y-2 w-12">
                <span className="text-[10px] text-white font-bold">2.5%</span>
                <div className="bg-blue-600 w-8 h-20 rounded-t-sm transition-all"></div>
                <span className="text-[9px] text-slate-500">Jan</span>
              </div>
              {/* Bar Fev */}
              <div className="flex flex-col items-center space-y-2 w-12">
                <span className="text-[10px] text-white font-bold">2.0%</span>
                <div className="bg-blue-600 w-8 h-16 rounded-t-sm transition-all"></div>
                <span className="text-[9px] text-slate-500">Fev</span>
              </div>
              {/* Bar Mar */}
              <div className="flex flex-col items-center space-y-2 w-12">
                <span className="text-[10px] text-white font-bold">1.5%</span>
                <div className="bg-blue-600 w-8 h-12 rounded-t-sm transition-all"></div>
                <span className="text-[9px] text-slate-500">Mar</span>
              </div>
              {/* Bar Abr */}
              <div className="flex flex-col items-center space-y-2 w-12">
                <span className="text-[10px] text-emerald-400 font-bold">1.2%</span>
                <div className="bg-emerald-500 w-8 h-10 rounded-t-sm transition-all"></div>
                <span className="text-[9px] text-slate-500">Abr</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default PeopleAnalytics;

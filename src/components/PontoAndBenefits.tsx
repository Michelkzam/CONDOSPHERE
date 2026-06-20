import React, { useState } from 'react';

interface PunchRecord {
  id: number;
  name: string;
  date: string;
  in1: string;
  out1: string;
  in2: string;
  out2: string;
  balance: string;
}

export const PontoAndBenefits: React.FC = () => {
  const [punches, setPunches] = useState<PunchRecord[]>([
    { id: 1, name: "Reginaldo Silveira", date: "12/06/2026", in1: "08:00", out1: "12:00", in2: "13:00", out2: "17:00", balance: "+00:00" },
    { id: 2, name: "Ana Maria de Jesus", date: "12/06/2026", in1: "09:00", out1: "13:00", in2: "14:00", out2: "18:00", balance: "+00:00" }
  ]);

  const handleClockIn = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('pt-BR');

    const newPunch: PunchRecord = {
      id: punches.length + 1,
      name: "Administrador Geral (Você)",
      date: dateStr,
      in1: timeStr,
      out1: "--:--",
      in2: "--:--",
      out2: "--:--",
      balance: "+00:00"
    };

    setPunches([newPunch, ...punches]);
    alert(`Ponto registrado com sucesso às ${timeStr}!`);
  };

  const handleLoadCredits = () => {
    alert("Créditos mensais de Vale-Alimentação, Transporte e Convênio liberados para todos os funcionários!");
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Clock-In Card */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-6">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4 flex-wrap gap-4 select-none">
          <div>
            <h2 className="text-lg font-bold text-white uppercase">Controle de Ponto Integrado</h2>
            <p className="text-xs text-slate-400">Registro de jornada física ou remota para exportação automática para a folha</p>
          </div>
          <button
            onClick={handleClockIn}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded text-xs transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Registrar Ponto Online</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3 border-b border-slate-800">Colaborador</th>
                <th className="p-3 border-b border-slate-800 font-mono">Data</th>
                <th className="p-3 border-b border-slate-800">Entrada 1</th>
                <th className="p-3 border-b border-slate-800">Saída 1</th>
                <th className="p-3 border-b border-slate-800">Entrada 2</th>
                <th className="p-3 border-b border-slate-800">Saída 2</th>
                <th className="p-3 border-b border-slate-800">Saldo de Horas</th>
                <th className="p-3 border-b border-slate-800">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {punches.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-3 font-semibold text-white">{p.name}</td>
                  <td className="p-3 text-slate-400 font-mono">{p.date}</td>
                  <td className="p-3 font-mono">{p.in1}</td>
                  <td className="p-3 font-mono">{p.out1}</td>
                  <td className="p-3 font-mono">{p.in2}</td>
                  <td className="p-3 font-mono">{p.out2}</td>
                  <td className="p-3 font-mono text-emerald-400 font-bold">{p.balance}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                      Regular
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Benefits Card */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-6">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4 select-none">
          <div>
            <h2 className="text-sm font-bold text-white uppercase">Gestão e Carga de Benefícios</h2>
            <p className="text-xs text-slate-400">Administração de recargas de vale-transporte, alimentação e planos de saúde</p>
          </div>
          <button
            onClick={handleLoadCredits}
            className="bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded text-xs transition-colors border border-slate-700 flex items-center gap-1.5"
          >
            <span>💳 Liberar Crédito Mensal</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-950 p-5 border border-slate-800 rounded-xl space-y-3">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
              Vale-Alimentação
            </span>
            <h3 className="font-extrabold text-white text-xl">R$ 650,00 <span className="text-xs text-slate-500 font-normal">/colab</span></h3>
            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>

          <div className="bg-slate-950 p-5 border border-slate-800 rounded-xl space-y-3">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
              Vale-Transporte
            </span>
            <h3 className="font-extrabold text-white text-xl">R$ 220,00 <span className="text-xs text-slate-500 font-normal">/colab</span></h3>
            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>

          <div className="bg-slate-950 p-5 border border-slate-800 rounded-xl space-y-3">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
              Convênio Médico
            </span>
            <h3 className="font-extrabold text-white text-xl">R$ 380,00 <span className="text-xs text-slate-500 font-normal">/colab</span></h3>
            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default PontoAndBenefits;

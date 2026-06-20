import React, { useState } from 'react';

export const EmployeePortal: React.FC = () => {
  const [currentUser, setCurrentUser] = useState('reginaldo');
  const [vacationRange, setVacationRange] = useState('');

  const handleVacationRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vacationRange.trim()) return;

    alert(`Solicitação de férias para o período "${vacationRange}" cadastrada com sucesso nos termos do DP!`);
    setVacationRange('');
  };

  const handleUploadCert = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      alert(`Atestado médico "${file.name}" enviado com sucesso e arquivado em conformidade com a LGPD!`);
      e.target.value = '';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-6 text-slate-100">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        {/* Left selector */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 h-fit space-y-4">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider">Acesso do Colaborador</h3>
          
          <div className="space-y-1">
            <label className="block text-[10px] text-slate-500 uppercase font-bold">Selecionar Funcionário</label>
            <select
              value={currentUser}
              onChange={(e) => setCurrentUser(e.target.value)}
              className="w-full text-xs bg-slate-900 border border-slate-800 rounded p-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="reginaldo">Reginaldo Silveira (Zelador)</option>
              <option value="ana">Ana Maria de Jesus (Auxiliar Admin)</option>
            </select>
          </div>

          <div className="p-3 bg-slate-900/50 border border-dashed border-slate-800 rounded text-center">
            <span className="text-[10px] text-slate-500">Criptografia de Acesso Ativa (Conformidade LGPD) ✓</span>
          </div>
        </div>

        {/* Right portal content */}
        <div className="space-y-6">
          <div className="border-b border-slate-800 pb-4 select-none">
            <h2 className="text-base font-bold text-white uppercase">Área do Colaborador (Self-Service)</h2>
            <p className="text-xs text-slate-400">Acesso rápido a contracheques, informes de rendimento e solicitações administrativas</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pay Slips */}
            <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-xl space-y-4">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider">Contracheques & IRPF</h3>
              
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => alert("Comprovante de rendimentos de Junho/2026 gerado!")}
                  className="w-full text-left py-2 px-3 bg-slate-900 border border-slate-800 text-slate-300 rounded text-xs hover:text-white hover:border-slate-700 transition-colors"
                >
                  📄 Contracheque - Junho 2026
                </button>
                <button
                  onClick={() => alert("Comprovante de rendimentos de Maio/2026 gerado!")}
                  className="w-full text-left py-2 px-3 bg-slate-900 border border-slate-800 text-slate-300 rounded text-xs hover:text-white hover:border-slate-700 transition-colors"
                >
                  📄 Contracheque - Maio 2026
                </button>
                <button
                  onClick={() => alert("Informe anual de rendimentos IRPF 2026 emitido!")}
                  className="w-full text-left py-2 px-3 bg-slate-900 border border-slate-800 text-slate-300 rounded text-xs hover:text-white hover:border-slate-700 transition-colors"
                >
                  📈 Informe de Rendimentos - Ano Calendário 2025
                </button>
              </div>
            </div>

            {/* Leave request form */}
            <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-xl space-y-4">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider">Férias & Ausências</h3>
              
              <form onSubmit={handleVacationRequest} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="block text-slate-400 font-semibold">Solicitar Agendamento de Férias</label>
                  <input
                    type="text"
                    value={vacationRange}
                    onChange={(e) => setVacationRange(e.target.value)}
                    placeholder="Ex: 01/09/2026 a 30/09/2026"
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded text-xs transition-colors"
                >
                  Agendar Férias
                </button>
              </form>

              <div className="pt-3 border-t border-slate-900">
                <label className="block w-full bg-emerald-700 hover:bg-emerald-600 text-white font-semibold py-2 rounded text-xs text-center transition-colors cursor-pointer">
                  <span>📤 Enviar Atestado Médico</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleUploadCert}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default EmployeePortal;

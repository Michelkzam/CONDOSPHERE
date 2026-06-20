import React, { useState } from 'react';

interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  baseSalary: number;
  advances: number;
  ot50: number;
  ot100: number;
  nightHours: number;
  absences: number;
  isRescinded?: boolean;
}

interface Advance {
  id: number;
  employeeId: string;
  amount: number;
  date: string;
  reason: string;
}

export const Payroll: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([
    { id: "reginaldo", name: "Reginaldo Silveira", role: "Zelador Geral", department: "Operacional", baseSalary: 2800.00, advances: 500.00, ot50: 0, ot100: 0, nightHours: 0, absences: 0 },
    { id: "ana", name: "Ana Maria de Jesus", role: "Auxiliar Administrativo", department: "Administração", baseSalary: 2200.00, advances: 400.00, ot50: 0, ot100: 0, nightHours: 0, absences: 0 },
  ]);

  const [advances, setAdvances] = useState<Advance[]>([
    { id: 1, employeeId: "reginaldo", amount: 500.00, date: "11/06/2026 10:15", reason: "Vale Semanal" },
    { id: 2, employeeId: "ana", amount: 400.00, date: "11/06/2026 10:30", reason: "Vale Semanal" }
  ]);

  // Modals state
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isCalculatorModalOpen, setIsCalculatorModalOpen] = useState(false);
  const [isTaxesModalOpen, setIsTaxesModalOpen] = useState(false);
  const [isRescisionModalOpen, setIsRescisionModalOpen] = useState(false);

  // Calculator Form State
  const [calcEmpId, setCalcEmpId] = useState("");
  const [ot50, setOt50] = useState(0);
  const [ot100, setOt100] = useState(0);
  const [nightHours, setNightHours] = useState(0);
  const [absences, setAbsences] = useState(0);

  // Rescision Form State
  const [rescEmpId, setRescEmpId] = useState("reginaldo");
  const [rescReason, setRescReason] = useState("sem_justa");
  const [rescSigned, setRescSigned] = useState(false);

  // Advance Form State
  const [advEmpId, setAdvEmpId] = useState("reginaldo");
  const [advAmount, setAdvAmount] = useState("");
  const [advReason, setAdvReason] = useState("");

  const handleCreateAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(advAmount) || 0;
    if (numericAmount <= 0) return;

    const newAdvance: Advance = {
      id: advances.length + 1,
      employeeId: advEmpId,
      amount: numericAmount,
      date: new Date().toLocaleString('pt-BR'),
      reason: advReason || "Vale Semanal",
    };

    setAdvances(prev => [...prev, newAdvance]);
    setEmployees(prev => prev.map(emp => emp.id === advEmpId ? {
      ...emp,
      advances: emp.advances + numericAmount
    } : emp));

    setIsAdvanceModalOpen(false);
    setAdvAmount("");
    setAdvReason("");
    alert("Adiantamento registrado com sucesso!");
  };

  const openCalculator = (emp: Employee) => {
    setCalcEmpId(emp.id);
    setOt50(emp.ot50);
    setOt100(emp.ot100);
    setNightHours(emp.nightHours);
    setAbsences(emp.absences);
    setIsCalculatorModalOpen(true);
  };

  const handleSaveCalculator = (e: React.FormEvent) => {
    e.preventDefault();
    setEmployees(prev => prev.map(emp => emp.id === calcEmpId ? {
      ...emp,
      ot50,
      ot100,
      nightHours,
      absences
    } : emp));
    setIsCalculatorModalOpen(false);
    alert("Cálculos da folha salvos e atualizados em tempo real!");
  };

  const handleRescision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescSigned) {
      alert("É obrigatório assinar eletronicamente o termo de rescisão para homologar.");
      return;
    }

    setEmployees(prev => prev.map(emp => emp.id === rescEmpId ? {
      ...emp,
      isRescinded: true
    } : emp));
    setIsRescisionModalOpen(false);
    setRescSigned(false);
    alert("Contrato de trabalho rescindido e homologado digitalmente!");
  };

  const downloadPagforRemittance = () => {
    const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '');
    const lines = [
      `033000000000000000020100756000010014028200000000045050519965005081CONDOSPHERE ERP-MUNICIPAL     SICOOB COOPERATIVO           ${dateStr}120000000001`,
      ...employees.filter(e => !e.isRescinded).map((emp, idx) => {
        const net = calculateNetPay(emp);
        const formattedNet = (net * 100).toFixed(0).padStart(10, '0');
        return `033000110000${idx + 1}A010111111111111111${emp.name.padEnd(30, ' ')}033000100140282${formattedNet}000000000000000000000000${dateStr}BRL0000000000`;
      }),
      `033999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999`
    ];

    const content = lines.join("\r\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `REMESSA_PAGFOR_SALARIOS_${dateStr}.TXT`;
    link.click();
    alert("Arquivo de remessa bancária de pagamentos (PAGFOR) baixado com sucesso!");
  };

  // Helper calculation logic (Same as index.html)
  const calculateNetPay = (emp: Employee) => {
    const base = emp.baseSalary;
    const hourVal = base / 220;
    const ot50Val = emp.ot50 * hourVal * 1.5;
    const ot100Val = emp.ot100 * hourVal * 2.0;
    const nightVal = emp.nightHours * hourVal * 0.2;
    const dsrVal = ((ot50Val + ot100Val + nightVal) / 26) * 4;
    const absenceVal = emp.absences * (base / 30);

    const totalBruto = base + ot50Val + ot100Val + nightVal + dsrVal - absenceVal;

    let inss = 0;
    if (totalBruto <= 1412) inss = totalBruto * 0.075;
    else if (totalBruto <= 2666.68) inss = 1412 * 0.075 + (totalBruto - 1412) * 0.09;
    else if (totalBruto <= 4000.03) inss = 1412 * 0.075 + 1254.68 * 0.09 + (totalBruto - 2666.68) * 0.12;
    else inss = 1412 * 0.075 + 1254.68 * 0.09 + 1333.35 * 0.12 + (totalBruto - 4000.03) * 0.14;

    let irrf = 0;
    const baseIrrf = totalBruto - inss;
    if (baseIrrf <= 2259.20) irrf = 0;
    else if (baseIrrf <= 2826.65) irrf = (baseIrrf * 0.075) - 169.44;
    else if (baseIrrf <= 3751.05) irrf = (baseIrrf * 0.15) - 381.44;
    else if (baseIrrf <= 4664.68) irrf = (baseIrrf * 0.225) - 662.77;
    else irrf = (baseIrrf * 0.275) - 896.00;

    return totalBruto - inss - irrf - emp.advances;
  };

  // Rescision math helper
  const getRescisionBreakdown = () => {
    const emp = employees.find(e => e.id === rescEmpId);
    if (!emp) return { salary: 0, s13: 0, vacation: 0, penalty: 0, total: 0 };

    const base = emp.baseSalary;
    const salary = (base / 30) * 12;
    const s13 = (base / 12) * 5.5;
    const vacation = s13 * 1.33;
    let penalty = 0;

    if (rescReason === 'sem_justa') {
      const totalAccumulatedSalary = (rescEmpId === 'reginaldo') ? (base * 17) : (base * 13);
      const accumulatedFgts = totalAccumulatedSalary * 0.08;
      penalty = accumulatedFgts * 0.40;
    }

    return {
      salary,
      s13,
      vacation,
      penalty,
      total: salary + s13 + vacation + penalty
    };
  };

  const rescisionData = getRescisionBreakdown();

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-6 text-slate-100">
      <div className="flex justify-between items-center flex-wrap gap-4 select-none">
        <div>
          <h2 className="text-lg font-bold text-white uppercase tracking-tight">Gestão de Folha de Pagamento CLT</h2>
          <p className="text-xs text-slate-400">Motor de cálculos em tempo real com emissão de encargos e rescisões digitais</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsTaxesModalOpen(true)}
            className="bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded text-xs transition-colors"
          >
            📊 Impostos & Remessa
          </button>
          <button
            onClick={() => setIsRescisionModalOpen(true)}
            className="bg-red-700 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded text-xs transition-colors"
          >
            ✂️ Rescisão CLT
          </button>
          <button
            onClick={() => setIsAdvanceModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded text-xs transition-colors"
          >
            💸 Registrar Adiantamento
          </button>
        </div>
      </div>

      {/* Employees Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
            <tr>
              <th className="p-3 border-b border-slate-800">Funcionário</th>
              <th className="p-3 border-b border-slate-800">Função</th>
              <th className="p-3 border-b border-slate-800">Salário Base</th>
              <th className="p-3 border-b border-slate-800">Adiantamentos</th>
              <th className="p-3 border-b border-slate-800">Líquido (Recalculado)</th>
              <th className="p-3 border-b border-slate-800">Status</th>
              <th className="p-3 border-b border-slate-800 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {employees.map((emp) => {
              const netPay = calculateNetPay(emp);
              return (
                <tr key={emp.id} className={`hover:bg-slate-800/30 transition-colors ${emp.isRescinded ? 'opacity-30 pointer-events-none' : ''}`}>
                  <td className="p-3 font-semibold text-white">{emp.name}</td>
                  <td className="p-3 text-slate-400">{emp.role}</td>
                  <td className="p-3">R$ {emp.baseSalary.toFixed(2).replace('.', ',')}</td>
                  <td className="p-3 text-red-400 font-semibold">R$ {emp.advances.toFixed(2).replace('.', ',')}</td>
                  <td className="p-3 font-bold text-white">R$ {netPay.toFixed(2).replace('.', ',')}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      emp.isRescinded 
                        ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {emp.isRescinded ? "Rescindido" : "Ativo"}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => openCalculator(emp)}
                      disabled={emp.isRescinded}
                      className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold py-1 px-3.5 rounded text-[11px] transition-colors"
                    >
                      ⚙️ Calcular
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ADIANTAMENTOS SALARIAIS HISTORY */}
      <div className="pt-4 border-t border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase select-none">Histórico de Adiantamentos Registrados</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Funcionário</th>
                <th className="p-3">Valor de Adiantamento</th>
                <th className="p-3">Data/Hora</th>
                <th className="p-3">Observação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {advances.map((adv) => {
                const emp = employees.find(e => e.id === adv.employeeId);
                return (
                  <tr key={adv.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 text-slate-500">#00{adv.id}</td>
                    <td className="p-3 font-semibold text-white">{emp?.name}</td>
                    <td className="p-3 text-red-400 font-bold">R$ {adv.amount.toFixed(2).replace('.', ',')}</td>
                    <td className="p-3 text-slate-400">{adv.date}</td>
                    <td className="p-3 text-slate-400 italic">{adv.reason}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: REAL-TIME PAYROLL CALCULATOR */}
      {isCalculatorModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSaveCalculator} className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm uppercase">⚙️ Motor de Cálculo de Folha CLT</h3>
              <button type="button" onClick={() => setIsCalculatorModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Horas Extras (50%)</label>
                  <input
                    type="number"
                    value={ot50}
                    onChange={(e) => setOt50(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Horas Extras (100%)</label>
                  <input
                    type="number"
                    value={ot100}
                    onChange={(e) => setOt100(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Horas Adicional Noturno (20%)</label>
                  <input
                    type="number"
                    value={nightHours}
                    onChange={(e) => setNightHours(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Faltas Injustificadas (Dias)</label>
                  <input
                    type="number"
                    value={absences}
                    onChange={(e) => setAbsences(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-800">
              <button type="button" onClick={() => setIsCalculatorModalOpen(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 py-2 rounded font-semibold transition-colors text-xs">Cancelar</button>
              <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 py-2 rounded font-semibold transition-colors text-xs">Salvar Alterações</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: CENTRAL DE GUIAS & REMESSA */}
      {isTaxesModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm uppercase">📊 Central de Impostos & Remessa Bancária</h3>
              <button type="button" onClick={() => setIsTaxesModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg flex flex-col justify-between">
                <span className="font-bold text-white mb-1 block">Guia GPS (INSS)</span>
                <button onClick={() => alert("Imprimindo Guia GPS...")} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-1.5 px-3 rounded text-[10px] mt-2 transition-colors">
                  🖨️ Gerar GPS
                </button>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg flex flex-col justify-between">
                <span className="font-bold text-white mb-1 block">Guia DARF (IRRF)</span>
                <button onClick={() => alert("Imprimindo DARF...")} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-1.5 px-3 rounded text-[10px] mt-2 transition-colors">
                  🖨️ Gerar DARF
                </button>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg flex flex-col justify-between">
                <span className="font-bold text-white mb-1 block">Guia GRF (FGTS)</span>
                <button onClick={() => alert("Imprimindo Guia GRF...")} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-1.5 px-3 rounded text-[10px] mt-2 transition-colors">
                  🖨️ Gerar GRF
                </button>
              </div>
              <div className="bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-lg flex flex-col justify-between">
                <span className="font-bold text-emerald-400 mb-1 block">Remessa PAGFOR</span>
                <button onClick={downloadPagforRemittance} className="bg-emerald-700 hover:bg-emerald-600 text-white font-semibold py-1.5 px-3 rounded text-[10px] mt-2 transition-colors">
                  📥 Baixar (.TXT)
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 text-right">
              <button onClick={() => setIsTaxesModalOpen(false)} className="bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded transition-colors text-xs">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: DISMISSAL / RESCISION CALCULATOR */}
      {isRescisionModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleRescision} className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm uppercase">✂️ Cálculo de Rescisão Trabalhista</h3>
              <button type="button" onClick={() => setIsRescisionModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Colaborador</label>
                  <select
                    value={rescEmpId}
                    onChange={(e) => setRescEmpId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                  >
                    {employees.filter(e => !e.isRescinded).map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Motivo do Distrato</label>
                  <select
                    value={rescReason}
                    onChange={(e) => setRescReason(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                  >
                    <option value="sem_justa">Demissão sem Justa Causa</option>
                    <option value="pedido">Pedido de Demissão</option>
                    <option value="com_justa">Demissão com Justa Causa</option>
                  </select>
                </div>
              </div>

              {/* Breakdown */}
              <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl font-mono space-y-1.5">
                <p className="text-white font-bold border-b border-slate-800 pb-2 mb-2">DEMONSTRATIVO DE RESCISÃO</p>
                <div className="flex justify-between text-[11px]">
                  <span>(+) Saldo de Salário:</span>
                  <span>R$ {rescisionData.salary.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>(+) 13º Proporcional:</span>
                  <span>R$ {rescisionData.s13.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>(+) Férias + 1/3:</span>
                  <span>R$ {rescisionData.vacation.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-[11px] border-b border-slate-800 border-dashed pb-2 mb-2">
                  <span>(+) Multa Rescisória (40% FGTS):</span>
                  <span>R$ {rescisionData.penalty.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between font-bold text-white">
                  <span>(=) TOTAL BRUTO RESCISÓRIO:</span>
                  <span className="text-emerald-400">R$ {rescisionData.total.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>

              {/* Digital Signature */}
              <div className="bg-slate-950 p-3 border border-slate-800 rounded-xl text-center space-y-2">
                <p className="font-bold text-white text-[11px]">Assinatura Eletrônica do Colaborador</p>
                <div className="border border-dashed border-slate-800 bg-black h-12 flex items-center justify-center rounded text-blue-400 font-mono text-xs select-none">
                  Assinado Eletronicamente por {employees.find(e => e.id === rescEmpId)?.name}
                </div>
                <label className="flex items-center justify-center gap-2 cursor-pointer text-[10px]">
                  <input
                    type="checkbox"
                    checked={rescSigned}
                    onChange={(e) => setRescSigned(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0"
                    required
                  />
                  <span>Confirmar distrato digital com as duas vias legais</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-800">
              <button type="button" onClick={() => setIsRescisionModalOpen(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 py-2 rounded font-semibold transition-colors text-xs">Cancelar</button>
              <button type="submit" className="flex-1 bg-red-600 hover:bg-red-500 py-2 rounded font-semibold transition-colors text-xs text-white">Efetuar Rescisão Digital</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 4: RECORD ADVANCE */}
      {isAdvanceModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateAdvance} className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 text-slate-100">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm uppercase">💸 Registrar Adiantamento Salarial</h3>
              <button type="button" onClick={() => setIsAdvanceModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Funcionário</label>
                <select
                  value={advEmpId}
                  onChange={(e) => setAdvEmpId(e.target.value)}
                  className="w-full text-xs bg-slate-950 border border-slate-800 rounded p-2.5 text-slate-100 focus:outline-none"
                >
                  {employees.filter(e => !e.isRescinded).map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Valor</label>
                <input
                  type="number"
                  value={advAmount}
                  onChange={(e) => setAdvAmount(e.target.value)}
                  placeholder="Ex: 250"
                  className="w-full text-xs bg-slate-950 border border-slate-800 rounded p-2.5 text-slate-100 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Observação</label>
                <input
                  type="text"
                  value={advReason}
                  onChange={(e) => setAdvReason(e.target.value)}
                  placeholder="Ex: Adiantamento farmácia"
                  className="w-full text-xs bg-slate-950 border border-slate-800 rounded p-2.5 text-slate-100 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-3 border-t border-slate-800">
              <button type="button" onClick={() => setIsAdvanceModalOpen(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 py-2 rounded text-xs">Cancelar</button>
              <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 py-2 rounded text-xs">Registrar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
export default Payroll;

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Receivable {
  id: any; owner_name: string; identifier: string; due_date: string;
  base_value: number; extra_fees: number; status: string; payment_date: string;
  charge_type: string; reference_month: string;
}

interface Payable {
  id: any; creditor: string; description: string; due_date: string;
  category: string; value: number; status: string; payment_date: string;
}

export const FinancialReports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dre' | 'balancete' | 'budget'>('dre');
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [payables, setPayables] = useState<Payable[]>([]);
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    setLoading(true);
    const [year, month] = period.split('-');
    const startDate = `${year}-${month}-01`;
    const endDate = new Date(+year, +month, 0).toISOString().split('T')[0];

    const [recRes, payRes] = await Promise.all([
      supabase.from('receivables').select('*').gte('due_date', startDate).lte('due_date', endDate).order('due_date'),
      supabase.from('payables').select('*').gte('due_date', startDate).lte('due_date', endDate).order('due_date')
    ]);
    // Also fetch all time data for budget projections
    const [allRecRes, allPayRes] = await Promise.all([
      supabase.from('receivables').select('*').order('due_date'),
      supabase.from('payables').select('*').order('due_date')
    ]);

    if (recRes.data) setReceivables(recRes.data as Receivable[]);
    if (payRes.data) setPayables(payRes.data as Payable[]);
    if (allRecRes.data) setAllReceivables(allRecRes.data as Receivable[]);
    if (allPayRes.data) setAllPayables(allPayRes.data as Payable[]);
    setLoading(false);
  };

  const [allReceivables, setAllReceivables] = useState<Receivable[]>([]);
  const [allPayables, setAllPayables] = useState<Payable[]>([]);

  // DRE calculations
  const totalRevenue = receivables.filter(r => r.status === 'Pago').reduce((s, r) => s + Number(r.base_value) + Number(r.extra_fees), 0);
  const totalReceivables = receivables.reduce((s, r) => s + Number(r.base_value) + Number(r.extra_fees), 0);
  const defaultRate = receivables.filter(r => r.status === 'Pendente' || r.status === 'Vencido').reduce((s, r) => s + Number(r.base_value) + Number(r.extra_fees), 0);
  const totalExpenses = payables.filter(p => p.status === 'Pago').reduce((s, p) => s + Number(p.value), 0);
  const totalOwed = payables.filter(p => p.status !== 'Pago').reduce((s, p) => s + Number(p.value), 0);
  const surplus = totalRevenue - totalExpenses;

  // Budget projections
  const avgMonthlyRevenue = allReceivables.length > 0
    ? allReceivables.filter(r => r.status === 'Pago').reduce((s, r) => s + Number(r.base_value), 0) / Math.max(1, new Set(allReceivables.map(r => r.reference_month).filter(Boolean)).size)
    : 0;
  const avgMonthlyExpenses = allPayables.length > 0
    ? allPayables.filter(p => p.status === 'Pago').reduce((s, p) => s + Number(p.value), 0) / Math.max(1, new Set(allPayables.map(p => p.due_date?.slice(0, 7)).filter(Boolean)).size)
    : 0;
  const projectedRevenue = avgMonthlyRevenue * 1.055;
  const projectedExpenses = avgMonthlyExpenses * 1.055;

  // Expenses by category
  const expensesByCat = payables.filter(p => p.status !== 'Pago').reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + Number(p.value);
    return acc;
  }, {});

  const exportCSV = () => {
    const rows = [
      ['Tipo', 'Descrição', 'Credor/Morador', 'Vencimento', 'Valor', 'Status', 'Data Pagamento'],
      ...receivables.map(r => ['Receita', r.identifier, r.owner_name, r.due_date, (Number(r.base_value) + Number(r.extra_fees)).toFixed(2), r.status, r.payment_date || '']),
      ...payables.map(p => ['Despesa', p.description, p.creditor, p.due_date, Number(p.value).toFixed(2), p.status, p.payment_date || ''])
    ];
    const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `relatorio_financeiro_${period}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const periodLabel = new Date(period + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-white uppercase">📊 Relatórios Financeiros</h2>
        <button onClick={exportCSV} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded text-xs uppercase">📥 Exportar CSV</button>
      </div>

      {/* Period selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400 font-bold uppercase">Período:</span>
        <input type="month" value={period} onChange={e => setPeriod(e.target.value)} className="bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white" />
        <span className="text-[10px] text-slate-500">{loading ? 'Carregando...' : `${receivables.length + payables.length} registros`}</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 rounded-lg p-1 max-w-md border border-slate-800">
        {(['dre', 'balancete', 'budget'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            {tab === 'dre' ? '📈 DRE' : tab === 'balancete' ? '📋 Balancete' : '📊 Orçamento'}
          </button>
        ))}
      </div>

      {/* DRE */}
      {activeTab === 'dre' && !loading && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-sm uppercase">Demonstrativo de Resultados</h3>
            <p className="text-[10px] text-slate-400">{periodLabel}</p>
          </div>

          <div className="space-y-2 text-xs">
            <p className="text-slate-400 uppercase font-bold text-[9px] tracking-wider">RECEITAS</p>
            <div className="flex justify-between text-slate-300 pl-2"><span>Receitas Operacionais (taxas)</span><span className="font-mono">R$ {totalReceivables.toFixed(2)}</span></div>
            <div className="flex justify-between text-slate-400 pl-4"><span>(-) Inadimplência</span><span className="font-mono text-red-400">-R$ {defaultRate.toFixed(2)}</span></div>
            <div className="flex justify-between text-white font-bold border-b border-slate-800 pb-2"><span>Receita Líquida</span><span className="font-mono text-emerald-400">R$ {totalRevenue.toFixed(2)}</span></div>

            <p className="text-slate-400 uppercase font-bold text-[9px] tracking-wider pt-2">DESPESAS</p>
            <div className="flex justify-between text-slate-300 pl-2"><span>Total de Despesas</span><span className="font-mono">R$ {totalExpenses.toFixed(2)}</span></div>
            <div className="flex justify-between text-slate-400 pl-4"><span>(-) A Pagar</span><span className="font-mono text-amber-400">-R$ {totalOwed.toFixed(2)}</span></div>
            <div className="flex justify-between text-white font-bold border-b border-slate-800 pb-2"><span>Despesas Realizadas</span><span className="font-mono text-red-400">R$ {totalExpenses.toFixed(2)}</span></div>

            <div className="flex justify-between pt-3 text-base font-extrabold">
              <span className="text-white">{surplus >= 0 ? '🟢 SUPERÁVIT' : '🔴 DÉFICIT'}</span>
              <span className={surplus >= 0 ? 'text-emerald-400' : 'text-red-400'}>R$ {surplus.toFixed(2)}</span>
            </div>
          </div>

          {/* DRE Chart */}
          <div className="border-t border-slate-800 pt-4">
            <p className="text-[9px] text-slate-400 uppercase font-bold mb-2">Composição das Despesas Pendentes</p>
            {Object.entries(expensesByCat).length === 0 ? (
              <p className="text-[10px] text-slate-500">Nenhuma despesa pendente no período</p>
            ) : (
              <div className="space-y-1.5">
                {Object.entries(expensesByCat).sort((a, b) => b[1] - a[1]).map(([cat, val]) => {
                  const pct = totalOwed > 0 ? (val / totalOwed) * 100 : 0;
                  return (
                    <div key={cat}>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-300">{cat}</span>
                        <span className="text-slate-400">R$ {val.toFixed(2)} ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 mt-0.5">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Balancete */}
      {activeTab === 'balancete' && !loading && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-sm uppercase">Balancete Financeiro</h3>
            <p className="text-[10px] text-slate-400">{periodLabel}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <p className="text-[9px] text-slate-400 uppercase font-bold mb-3">Ativo (Receitas)</p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-slate-300">Recebido (Pago)</span><span className="font-mono text-emerald-400">R$ {totalRevenue.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-slate-300">A Receber (Pendente)</span><span className="font-mono text-yellow-400">R$ {defaultRate.toFixed(2)}</span></div>
                <div className="flex justify-between border-t border-slate-800 pt-2 font-bold"><span className="text-white">Total Ativo</span><span className="font-mono text-white">R$ {(totalRevenue + defaultRate).toFixed(2)}</span></div>
              </div>
            </div>
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <p className="text-[9px] text-slate-400 uppercase font-bold mb-3">Passivo (Despesas)</p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-slate-300">Pago</span><span className="font-mono text-emerald-400">R$ {totalExpenses.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-slate-300">A Pagar</span><span className="font-mono text-amber-400">R$ {totalOwed.toFixed(2)}</span></div>
                <div className="flex justify-between border-t border-slate-800 pt-2 font-bold"><span className="text-white">Total Passivo</span><span className="font-mono text-white">R$ {(totalExpenses + totalOwed).toFixed(2)}</span></div>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <p className="text-[9px] text-slate-400 uppercase font-bold mb-2">Saldo Líquido do Período</p>
            <p className={`text-2xl font-extrabold ${surplus >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {surplus >= 0 ? '+' : ''}R$ {surplus.toFixed(2)}
            </p>
          </div>

          {/* Mini table of recent transactions */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[9px] tracking-wider">
                <tr><th className="p-2 text-left">Tipo</th><th className="p-2 text-left">Descrição</th><th className="p-2 text-right">Valor</th><th className="p-2 text-left">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {receivables.filter(r => r.status === 'Pago').slice(0, 5).map(r => (
                  <tr key={r.id} className="hover:bg-slate-800/30">
                    <td className="p-2 text-emerald-400">📈 Receita</td>
                    <td className="p-2">{r.owner_name} - {r.identifier}</td>
                    <td className="p-2 text-right font-mono">R$ {(Number(r.base_value) + Number(r.extra_fees)).toFixed(2)}</td>
                    <td className="p-2"><span className="bg-emerald-500/10 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded">Pago</span></td>
                  </tr>
                ))}
                {payables.filter(p => p.status === 'Pago').slice(0, 5).map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/30">
                    <td className="p-2 text-red-400">📉 Despesa</td>
                    <td className="p-2">{p.creditor} - {p.description}</td>
                    <td className="p-2 text-right font-mono">-R$ {Number(p.value).toFixed(2)}</td>
                    <td className="p-2"><span className="bg-emerald-500/10 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded">Pago</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Budget */}
      {activeTab === 'budget' && !loading && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-sm uppercase">Previsão Orçamentária</h3>
            <p className="text-[10px] text-slate-400">Projeção baseada em dados históricos + IPCA 5,5%</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <p className="text-[9px] text-slate-400 uppercase font-bold">Média Mensal (Histórico)</p>
              <p className="text-lg font-bold text-emerald-400 mt-1">R$ {avgMonthlyRevenue.toFixed(2)}</p>
              <p className="text-[9px] text-slate-500">Receitas</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <p className="text-[9px] text-slate-400 uppercase font-bold">Média Mensal (Histórico)</p>
              <p className="text-lg font-bold text-red-400 mt-1">R$ {avgMonthlyExpenses.toFixed(2)}</p>
              <p className="text-[9px] text-slate-500">Despesas</p>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
            <p className="text-[9px] text-slate-400 uppercase font-bold">Projeção Anual + IPCA 5,5%</p>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="text-center p-3 bg-slate-900 rounded-lg"><p className="text-[9px] text-slate-400 uppercase">Receita</p><p className="font-bold text-emerald-400">R$ {(projectedRevenue * 12).toFixed(2)}</p></div>
              <div className="text-center p-3 bg-slate-900 rounded-lg"><p className="text-[9px] text-slate-400 uppercase">Despesa</p><p className="font-bold text-red-400">R$ {(projectedExpenses * 12).toFixed(2)}</p></div>
              <div className="text-center p-3 bg-slate-900 rounded-lg"><p className="text-[9px] text-slate-400 uppercase">Resultado</p><p className={`font-bold ${(projectedRevenue - projectedExpenses) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                R$ {((projectedRevenue - projectedExpenses) * 12).toFixed(2)}
              </p></div>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <p className="text-[9px] text-slate-400 uppercase font-bold">Cota Condominial Sugerida</p>
            <div className="flex items-end gap-4 mt-2">
              <p className="text-3xl font-extrabold text-blue-400">R$ {projectedExpenses > 0 ? Math.ceil(projectedExpenses / Math.max(1, receivables.length || 1) / 10) * 10 : 0}.00</p>
              <p className="text-[10px] text-slate-400 mb-1">/ unidade / mês</p>
            </div>
            <p className="text-[9px] text-slate-500 mt-1">Baseado em {receivables.length || 0} unidades ativas e despesa média de R$ {avgMonthlyExpenses.toFixed(2)}</p>
          </div>
        </div>
      )}

      {loading && <div className="text-center text-slate-500 py-8 text-xs">Carregando dados financeiros...</div>}
    </div>
  );
};

export default FinancialReports;

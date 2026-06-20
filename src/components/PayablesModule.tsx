import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface PayableItem {
  id: any;
  creditor: string;
  description: string;
  due_date: string;
  category: string;
  value: number;
  status: string;
  recurrence: string;
  payment_method: string;
  payment_date: string;
  created_at: string;
}

export const PayablesModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'aprovacao' | 'agendamento' | 'batch'>('aprovacao');
  const [payables, setPayables] = useState<PayableItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<any[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    loadPending();
  }, []);

  const loadPending = async () => {
    const { data } = await supabase.from('payables').select('*').order('due_date', { ascending: true });
    if (data) setPayables(data as PayableItem[]);
  };

  // Approval levels
  const approvalQueue = payables.filter(p => p.status === 'Pendente');
  const approvedItems = payables.filter(p => p.status === 'Aprovado');
  const totalApproved = approvedItems.reduce((s, p) => s + Number(p.value), 0);
  const totalPending = approvalQueue.reduce((s, p) => s + Number(p.value), 0);
  const totalOverdue = approvalQueue.filter(p => p.due_date < new Date().toISOString().split('T')[0]).reduce((s, p) => s + Number(p.value), 0);

  const handleApprove = async (id: any, level: 'sindico' | 'conselho') => {
    const note = level === 'sindico' ? 'Aprovado pelo Síndico' : 'Aprovado pelo Conselho Fiscal';
    const { error } = await supabase.from('payables').update({
      status: 'Aprovado',
      notes: note
    }).eq('id', id);
    if (error) return alert('Erro: ' + error.message);
    loadPending();
  };

  const handleReject = async (id: any) => {
    const reason = prompt('Motivo da rejeição:');
    if (!reason) return;
    await supabase.from('payables').update({ status: 'Rejeitado', notes: `Rejeitado: ${reason}` }).eq('id', id);
    loadPending();
  };

  const handleBatchTransmit = async () => {
    const batch = payables.filter(p => selectedIds.includes(p.id) || p.status === 'Aprovado');
    if (batch.length === 0) return alert('Nenhuma conta selecionada para transmissão.');

    const total = batch.reduce((s, p) => s + Number(p.value), 0);
    if (!confirm(`Transmitir ${batch.length} conta(s) no valor total de R$ ${total.toFixed(2)} para pagamento?`)) return;

    for (const p of batch) {
      await supabase.from('payables').update({
        status: 'Pago',
        payment_method: 'PIX',
        payment_date: new Date().toISOString().split('T')[0]
      }).eq('id', p.id);
    }
    setSelectedIds([]);
    loadPending();
    alert(`✅ ${batch.length} conta(s) transmitidas e marcadas como pagas.`);
  };

  const toggleSelect = (id: any) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const pendingItems = payables.filter(p => p.status === 'Pendente');
  const overdueItems = pendingItems.filter(p => p.due_date < new Date().toISOString().split('T')[0]);
  const scheduledItems = payables.filter(p => p.status === 'Aprovado' || p.status === 'Pago');

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white uppercase">📋 Gestão de Pagamentos</h2>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <p className="text-[9px] text-slate-400 uppercase font-bold">A Aprovar</p>
          <p className="text-lg font-bold text-amber-400">R$ {totalPending.toFixed(2)}</p>
          <p className="text-[9px] text-slate-500">{approvalQueue.length} contas</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <p className="text-[9px] text-slate-400 uppercase font-bold">Vencidas</p>
          <p className="text-lg font-bold text-red-400">R$ {totalOverdue.toFixed(2)}</p>
          <p className="text-[9px] text-red-400">{overdueItems.length} contas</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <p className="text-[9px] text-slate-400 uppercase font-bold">Aprovadas</p>
          <p className="text-lg font-bold text-emerald-400">R$ {totalApproved.toFixed(2)}</p>
          <p className="text-[9px] text-slate-500">{approvedItems.length} contas</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <p className="text-[9px] text-slate-400 uppercase font-bold">Total a Pagar</p>
          <p className="text-lg font-bold text-white">R$ {(totalPending + totalApproved).toFixed(2)}</p>
          <p className="text-[9px] text-slate-500">passivo total</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 rounded-lg p-1 max-w-md border border-slate-800">
        {(['aprovacao', 'agendamento', 'batch'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            {tab === 'aprovacao' ? `📌 Aprovação (${pendingItems.length})` : tab === 'agendamento' ? '📅 Agendados' : '🚀 Lote'}
          </button>
        ))}
      </div>

      {/* Approval Tab */}
      {activeTab === 'aprovacao' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3 text-left">Credor</th>
                <th className="p-3 text-left">Descrição</th>
                <th className="p-3 text-left">Vencimento</th>
                <th className="p-3 text-left">Categoria</th>
                <th className="p-3 text-right">Valor</th>
                <th className="p-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {pendingItems.length === 0 ? (
                <tr><td colSpan={6} className="text-center p-6 text-slate-500">Nenhuma conta pendente de aprovação</td></tr>
              ) : pendingItems.map(p => (
                <tr key={p.id} className="hover:bg-slate-800/30">
                  <td className="p-3 font-bold text-white">{p.creditor}</td>
                  <td className="p-3 text-slate-400 max-w-[200px] truncate">{p.description}</td>
                  <td className={`p-3 ${p.due_date < new Date().toISOString().split('T')[0] ? 'text-red-400' : 'text-blue-300'}`}>
                    {new Date(p.due_date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-3"><span className="bg-slate-800 text-slate-300 text-[9px] px-1.5 py-0.5 rounded">{p.category}</span></td>
                  <td className="p-3 text-right font-mono font-bold">R$ {Number(p.value).toFixed(2)}</td>
                  <td className="p-3">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => handleApprove(p.id, 'sindico')} className="bg-emerald-700 hover:bg-emerald-600 text-white px-2 py-1 rounded text-[9px] font-bold">Aprovar</button>
                      <button onClick={() => handleReject(p.id)} className="bg-red-700 hover:bg-red-600 text-white px-2 py-1 rounded text-[9px] font-bold">Rejeitar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Scheduled Tab */}
      {activeTab === 'agendamento' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-white text-sm uppercase">Contas Aprovadas</h3>
              <p className="text-[10px] text-slate-400">{approvedItems.length} conta(s) aprovadas aguardando pagamento</p>
            </div>
            {approvedItems.length > 0 && (
              <button onClick={handleBatchTransmit} className="bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 rounded text-xs uppercase">📤 Transmitir em Lote</button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr><th className="p-2 text-left">Credor</th><th className="p-2 text-left">Descrição</th><th className="p-2 text-left">Vencimento</th><th className="p-2 text-right">Valor</th><th className="p-2 text-left">Status</th><th className="p-2 text-center">Sel.</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {scheduledItems.length === 0 ? (
                  <tr><td colSpan={6} className="text-center p-4 text-slate-500">Nenhuma conta aprovada ou paga</td></tr>
                ) : scheduledItems.map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/30">
                    <td className="p-2 font-bold text-white">{p.creditor}</td>
                    <td className="p-2 text-slate-400">{p.description}</td>
                    <td className="p-2 text-blue-300">{new Date(p.due_date).toLocaleDateString('pt-BR')}</td>
                    <td className="p-2 text-right font-mono">R$ {Number(p.value).toFixed(2)}</td>
                    <td className="p-2">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${p.status === 'Pago' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>{p.status}</span>
                    </td>
                    <td className="p-2 text-center">
                      {p.status === 'Aprovado' && (
                        <input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => toggleSelect(p.id)} className="accent-blue-500" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Batch Tab */}
      {activeTab === 'batch' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="font-bold text-white text-sm uppercase">🚀 Transmissão em Lote</h3>
          <p className="text-xs text-slate-400">Selecione múltiplas contas e transmita via PIX/TED em lote para o banco.</p>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-center">
              <p className="text-[9px] text-slate-400 uppercase font-bold">Selecionados</p>
              <p className="text-xl font-bold text-white">{selectedIds.length}</p>
              <p className="text-[9px] text-slate-500">contas</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-center">
              <p className="text-[9px] text-slate-400 uppercase font-bold">Valor Total</p>
              <p className="text-xl font-bold text-blue-400">
                R$ {payables.filter(p => selectedIds.includes(p.id)).reduce((s, p) => s + Number(p.value), 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-center">
              <p className="text-[9px] text-slate-400 uppercase font-bold">Métodos</p>
              <p className="text-lg font-bold text-emerald-400">PIX</p>
              <p className="text-[9px] text-slate-500">transferência instantânea</p>
            </div>
          </div>

          <div className="flex gap-2 justify-center">
            <button onClick={() => setSelectedIds(payables.filter(p => p.status === 'Pendente' || p.status === 'Aprovado').map(p => p.id))} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded text-xs font-bold uppercase">Selecionar Todos Pendentes</button>
            <button onClick={() => setSelectedIds([])} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded text-xs font-bold uppercase">Limpar</button>
            <button onClick={handleBatchTransmit} disabled={selectedIds.length === 0} className={`px-4 py-2 rounded text-xs font-bold uppercase ${selectedIds.length === 0 ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 text-white'}`}>
              📤 Transmitir {selectedIds.length} Conta(s)
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-2 text-center"><input type="checkbox" checked={selectAll} onChange={() => { setSelectAll(!selectAll); setSelectedIds(selectAll ? [] : payables.filter(p => p.status !== 'Pago').map(p => p.id)); }} className="accent-blue-500" /></th>
                  <th className="p-2 text-left">Credor</th><th className="p-2 text-left">Vencimento</th><th className="p-2 text-right">Valor</th><th className="p-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {payables.filter(p => p.status !== 'Pago').map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/30">
                    <td className="p-2 text-center"><input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => toggleSelect(p.id)} className="accent-blue-500" /></td>
                    <td className="p-2 font-bold text-white">{p.creditor}</td>
                    <td className="p-2 text-blue-300">{new Date(p.due_date).toLocaleDateString('pt-BR')}</td>
                    <td className="p-2 text-right font-mono">R$ {Number(p.value).toFixed(2)}</td>
                    <td className="p-2">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${p.status === 'Aprovado' ? 'bg-blue-500/10 text-blue-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{p.status}</span>
                    </td>
                  </tr>
                ))}
                {payables.filter(p => p.status !== 'Pago').length === 0 && (
                  <tr><td colSpan={5} className="text-center p-4 text-slate-500">Todas as contas estão pagas</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayablesModule;

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Cancellation {
  id: any;
  receivable_id: string;
  original_value: number;
  refund_value: number;
  cancellation_type: string;
  reason: string;
  refund_method: string | null;
  original_payment_method: string | null;
  original_payment_date: string | null;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  executed_at: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
}

interface Receivable {
  id: any;
  identifier: string;
  owner: string;
  baseValue: number;
  extraCharges: number;
  status: string;
  paymentMethod: string;
  paymentDate: string;
  dueDate: string;
  chargeType: string;
}

const CANCEL_TYPES = [
  { value: 'cancelamento', label: 'Cancelamento', desc: 'Cancela o pagamento e reverte para pendente' },
  { value: 'estorno', label: 'Estorno', desc: 'Estorna o valor pago, mantendo o registro' },
  { value: 'devolucao', label: 'Devolução', desc: 'Devolve o valor ao morador via transferência' }
];
const REFUND_METHODS = ['PIX', 'TED', 'Boleto', 'Dinheiro', 'Crédito em Conta', 'Depósito'];
const STATUS_FLOW = ['Pendente', 'Aprovado', 'Concluído', 'Rejeitado'];

export const CancellationRefund: React.FC<{ receivables?: Receivable[] }> = ({ receivables = [] }) => {
  const [cancellations, setCancellations] = useState<Cancellation[]>([]);
  const [filterStatus, setFilterStatus] = useState('Todas');
  const [showForm, setShowForm] = useState(false);
  const [stats, setStats] = useState({ pendentes: 0, aprovados: 0, concluidos: 0, total: 0 });

  // Form state
  const [formRecId, setFormRecId] = useState('');
  const [formType, setFormType] = useState('cancelamento');
  const [formReason, setFormReason] = useState('');
  const [formRefundMethod, setFormRefundMethod] = useState('PIX');
  const [formRefundValue, setFormRefundValue] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Detail view
  const [selectedItem, setSelectedItem] = useState<Cancellation | null>(null);
  const [detailNote, setDetailNote] = useState('');

  useEffect(() => { loadCancellations(); }, []);

  const loadCancellations = async () => {
    const { data } = await supabase.from('payment_cancellations').select('*').order('created_at', { ascending: false });
    if (data) {
      const items = data as Cancellation[];
      setCancellations(items);
      setStats({
        pendentes: items.filter(i => i.status === 'Pendente').length,
        aprovados: items.filter(i => i.status === 'Aprovado').length,
        concluidos: items.filter(i => i.status === 'Concluído').length,
        total: items.reduce((s, i) => s + Number(i.refund_value), 0)
      });
    }
  };

  const paidReceivables = receivables.filter(r => r.status === 'Pago' || r.status === 'Acordo');
  const selectedRec = paidReceivables.find(r => r.id === formRecId);

  const handleRequestCancellation = async () => {
    if (!formRecId || !formReason) return alert('Selecione o recebível e informe o motivo.');
    const rec = paidReceivables.find(r => r.id === formRecId);
    if (!rec) return alert('Recebível não encontrado.');

    const refundVal = formRefundValue ? parseFloat(formRefundValue) : rec.baseValue + (rec.extraCharges || 0);

    const payload = {
      receivable_id: formRecId,
      original_value: rec.baseValue + (rec.extraCharges || 0),
      refund_value: formType === 'cancelamento' ? 0 : refundVal,
      cancellation_type: formType,
      reason: formReason,
      refund_method: formType !== 'cancelamento' ? formRefundMethod : null,
      original_payment_method: rec.paymentMethod || null,
      original_payment_date: rec.paymentDate || null,
      status: 'Pendente',
      notes: formNotes || null
    };

    const { error } = await supabase.from('payment_cancellations').insert([payload]);
    if (error) return alert('Erro: ' + error.message);

    // If cancellation type is 'cancelamento', instantly revert the receivable to Pendente
    if (formType === 'cancelamento') {
      await supabase.from('receivables').update({
        status: 'Pendente',
        payment_method: null,
        payment_date: null
      }).eq('id', formRecId);
    }

    resetForm();
    setShowForm(false);
    loadCancellations();
    alert('Solicitação de cancelamento registrada com sucesso!');
  };

  const handleApprove = async (item: Cancellation) => {
    await supabase.from('payment_cancellations').update({
      status: 'Aprovado',
      approved_by: 'Administrador',
      approved_at: new Date().toISOString()
    }).eq('id', item.id);
    loadCancellations();
  };

  const handleExecute = async (item: Cancellation) => {
    // Execute the refund/reversal
    const updates: any = {
      status: 'Concluído',
      executed_at: new Date().toISOString()
    };

    await supabase.from('payment_cancellations').update(updates).eq('id', item.id);

    // For estorno/devolucao: revert receivable to Pendente
    if (item.cancellation_type === 'estorno' || item.cancellation_type === 'devolucao') {
      await supabase.from('receivables').update({
        status: 'Pendente',
        payment_method: null,
        payment_date: null
      }).eq('id', item.receivable_id);
    }

    loadCancellations();
    alert(`✅ ${item.cancellation_type === 'devolucao' ? 'Devolução' : 'Estorno'} concluído!`);
  };

  const handleReject = async (item: Cancellation) => {
    const reason = prompt('Motivo da rejeição:');
    if (!reason) return;
    await supabase.from('payment_cancellations').update({
      status: 'Rejeitado',
      notes: reason
    }).eq('id', item.id);
    loadCancellations();
  };

  const handleSaveNote = async (item: Cancellation) => {
    if (!detailNote.trim()) return;
    await supabase.from('payment_cancellations').update({
      notes: item.notes ? item.notes + '\n' + detailNote : detailNote
    }).eq('id', item.id);
    setDetailNote('');
    loadCancellations();
    setSelectedItem({ ...item, notes: (item.notes || '') + '\n' + detailNote });
  };

  const resetForm = () => {
    setFormRecId(''); setFormType('cancelamento'); setFormReason('');
    setFormRefundMethod('PIX'); setFormRefundValue(''); setFormNotes('');
  };

  const typeBadge = (t: string) => {
    const map: Record<string, string> = {
      cancelamento: 'bg-red-500/10 text-red-400',
      estorno: 'bg-amber-500/10 text-amber-400',
      devolucao: 'bg-blue-500/10 text-blue-400'
    };
    return map[t] || 'bg-slate-500/10 text-slate-400';
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      Pendente: 'bg-yellow-500/10 text-yellow-400',
      Aprovado: 'bg-blue-500/10 text-blue-400',
      'Concluído': 'bg-emerald-500/10 text-emerald-400',
      Rejeitado: 'bg-red-500/10 text-red-400'
    };
    return map[s] || 'bg-slate-500/10 text-slate-400';
  };

  const statusColor = (s: string) => {
    const map: Record<string, string> = {
      Pendente: 'text-yellow-400',
      Aprovado: 'text-blue-400',
      'Concluído': 'text-emerald-400',
      Rejeitado: 'text-red-400'
    };
    return map[s] || 'text-slate-400';
  };

  const filtered = cancellations.filter(c => filterStatus === 'Todas' || c.status === filterStatus);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-white uppercase">🔄 Cancelamentos e Estornos</h2>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded text-xs">+ Solicitar Cancelamento</button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <p className="text-[9px] text-slate-400 uppercase font-bold">Pendentes</p>
          <p className="text-lg font-bold text-yellow-400">{stats.pendentes}</p>
          <p className="text-[9px] text-slate-500">solicitações</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <p className="text-[9px] text-slate-400 uppercase font-bold">Aprovados</p>
          <p className="text-lg font-bold text-blue-400">{stats.aprovados}</p>
          <p className="text-[9px] text-slate-500">aguardando execução</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <p className="text-[9px] text-slate-400 uppercase font-bold">Concluídos</p>
          <p className="text-lg font-bold text-emerald-400">{stats.concluidos}</p>
          <p className="text-[9px] text-slate-500">finalizados</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <p className="text-[9px] text-slate-400 uppercase font-bold">Total Devolvido</p>
          <p className="text-lg font-bold text-white">R$ {stats.total.toFixed(2)}</p>
          <p className="text-[9px] text-slate-500">em estornos/devoluções</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white">
          <option value="Todas">Todas</option>
          {STATUS_FLOW.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="text-[10px] text-slate-500 self-center">{filtered.length} registro(s)</span>
      </div>

      {/* Table or Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* List */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
          <p className="text-[9px] text-slate-400 uppercase font-bold">Solicitações</p>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {filtered.map(c => (
              <div key={c.id} onClick={() => setSelectedItem(c)} className={`p-3 rounded-lg cursor-pointer border ${selectedItem?.id === c.id ? 'border-blue-500 bg-slate-800' : 'border-slate-800 hover:bg-slate-800/50'}`}>
                <div className="flex justify-between items-start">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${typeBadge(c.cancellation_type)}`}>{c.cancellation_type}</span>
                  <span className={`text-[9px] font-bold ${statusColor(c.status)}`}>{c.status}</span>
                </div>
                <p className="text-xs font-bold text-white mt-1 truncate">{c.reason}</p>
                <p className="text-[9px] text-slate-400">R$ {Number(c.original_value).toFixed(2)} → {c.refund_method || '-'}</p>
                <p className="text-[9px] text-slate-500">{new Date(c.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
            ))}
            {filtered.length === 0 && <p className="text-xs text-slate-500 text-center py-4">Nenhuma solicitação</p>}
          </div>
        </div>

        {/* Detail */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4">
          {selectedItem ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-white text-sm uppercase">Detalhes da Solicitação</h3>
                  <p className="text-[9px] text-slate-400">{selectedItem.id}</p>
                </div>
                <div className="flex gap-1">
                  {selectedItem.status === 'Pendente' && (
                    <>
                      <button onClick={() => handleApprove(selectedItem)} className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded text-[9px] font-bold">✓ Aprovar</button>
                      <button onClick={() => handleReject(selectedItem)} className="bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded text-[9px] font-bold">✕ Rejeitar</button>
                    </>
                  )}
                  {selectedItem.status === 'Aprovado' && (
                    <button onClick={() => handleExecute(selectedItem)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase">
                      {selectedItem.cancellation_type === 'devolucao' ? '💰 Efetuar Devolução' : '🔄 Executar Estorno'}
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <p className="text-[9px] text-slate-400 uppercase font-bold">Tipo</p>
                  <p className={`font-bold mt-0.5 ${statusColor(selectedItem.cancellation_type)}`}>{selectedItem.cancellation_type}</p>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <p className="text-[9px] text-slate-400 uppercase font-bold">Status</p>
                  <p className={`font-bold mt-0.5 ${statusColor(selectedItem.status)}`}>{selectedItem.status}</p>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <p className="text-[9px] text-slate-400 uppercase font-bold">Valor Original</p>
                  <p className="font-bold text-white mt-0.5">R$ {Number(selectedItem.original_value).toFixed(2)}</p>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <p className="text-[9px] text-slate-400 uppercase font-bold">Valor Devolvido</p>
                  <p className="font-bold text-blue-400 mt-0.5">R$ {Number(selectedItem.refund_value).toFixed(2)}</p>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <p className="text-[9px] text-slate-400 uppercase font-bold">Método de Devolução</p>
                  <p className="font-bold text-white mt-0.5">{selectedItem.refund_method || '-'}</p>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <p className="text-[9px] text-slate-400 uppercase font-bold">Pagamento Original</p>
                  <p className="font-bold text-white mt-0.5">{selectedItem.original_payment_method || '-'} / {selectedItem.original_payment_date ? new Date(selectedItem.original_payment_date).toLocaleDateString('pt-BR') : '-'}</p>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <p className="text-[9px] text-slate-400 uppercase font-bold">Motivo</p>
                <p className="text-xs text-slate-200 mt-1">{selectedItem.reason}</p>
              </div>

              {selectedItem.notes && (
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <p className="text-[9px] text-slate-400 uppercase font-bold">Observações</p>
                  <p className="text-xs text-slate-200 mt-1 whitespace-pre-wrap">{selectedItem.notes}</p>
                </div>
              )}

              {selectedItem.approved_by && (
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[10px]">
                  <p><span className="text-slate-400">Aprovado por:</span> <strong className="text-white">{selectedItem.approved_by}</strong></p>
                  <p><span className="text-slate-400">Em:</span> {selectedItem.approved_at ? new Date(selectedItem.approved_at).toLocaleString('pt-BR') : '-'}</p>
                  {selectedItem.executed_at && <p><span className="text-slate-400">Executado em:</span> {new Date(selectedItem.executed_at).toLocaleString('pt-BR')}</p>}
                </div>
              )}

              {/* Add note */}
              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <input type="text" value={detailNote} onChange={e => setDetailNote(e.target.value)} placeholder="Adicionar observação..." className="flex-1 bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white" />
                <button onClick={() => handleSaveNote(selectedItem)} className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded text-[9px] font-bold">Salvar</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-500 text-xs">
              Selecione uma solicitação para ver detalhes
            </div>
          )}
        </div>
      </div>

      {/* New Cancellation Request Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-2xl w-full space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm uppercase">📝 Solicitar Cancelamento / Estorno</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="form-group">
              <label className="form-label">Recebível * (somente itens pagos ou em acordo)</label>
              <select value={formRecId} onChange={e => setFormRecId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white">
                <option value="">Selecione...</option>
                {paidReceivables.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.owner} - {r.identifier} - R$ {(r.baseValue + (r.extraCharges || 0)).toFixed(2)} ({r.status})
                  </option>
                ))}
              </select>
              {paidReceivables.length === 0 && <p className="text-[9px] text-amber-400 mt-1">Nenhum recebível pago disponível para cancelamento.</p>}
            </div>

            {selectedRec && (
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 grid grid-cols-3 gap-2 text-[10px]">
                <div><span className="text-slate-400">Tipo:</span> <strong className="text-white">{selectedRec.chargeType || 'Ordinária'}</strong></div>
                <div><span className="text-slate-400">Pagamento:</span> <strong className="text-white">{selectedRec.paymentMethod || '-'}</strong></div>
                <div><span className="text-slate-400">Data:</span> <strong className="text-white">{selectedRec.paymentDate ? new Date(selectedRec.paymentDate).toLocaleDateString('pt-BR') : '-'}</strong></div>
                <div><span className="text-slate-400">Valor:</span> <strong className="text-white">R$ {(selectedRec.baseValue + (selectedRec.extraCharges || 0)).toFixed(2)}</strong></div>
                <div><span className="text-slate-400">Status:</span> <strong className="text-white">{selectedRec.status}</strong></div>
                <div><span className="text-slate-400">Vencimento:</span> <strong className="text-white">{new Date(selectedRec.dueDate).toLocaleDateString('pt-BR')}</strong></div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="form-label">Tipo de Cancelamento *</label>
                <select value={formType} onChange={e => setFormType(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white">
                  {CANCEL_TYPES.map(ct => <option key={ct.value} value={ct.value}>{ct.label} - {ct.desc}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Motivo *</label>
                <input type="text" value={formReason} onChange={e => setFormReason(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" placeholder="Ex: Pagamento indevido" />
              </div>
            </div>

            {formType !== 'cancelamento' && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-amber-950/20 rounded-lg border border-amber-800/30">
                <p className="text-[9px] text-amber-400 col-span-2 font-bold uppercase">Dados da Devolução</p>
                <div className="form-group">
                  <label className="form-label">Método de Devolução *</label>
                  <select value={formRefundMethod} onChange={e => setFormRefundMethod(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white">
                    {REFUND_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Valor a Devolver *</label>
                  <input type="number" step="0.01" value={formRefundValue} onChange={e => setFormRefundValue(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                    placeholder={selectedRec ? `Máx: R$ ${(selectedRec.baseValue + (selectedRec.extraCharges || 0)).toFixed(2)}` : '0.00'} />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Observações (opcional)</label>
              <textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} rows={2} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" placeholder="Informações adicionais..." />
            </div>

            {formType === 'cancelamento' && (
              <div className="bg-blue-950/30 text-blue-400 text-[10px] p-3 rounded border border-blue-800/30">
                ⚡ <strong>Cancelamento</strong>: O recebível será revertido para <strong>Pendente</strong> imediatamente após a solicitação. Nenhum valor será devolvido.
              </div>
            )}
            {formType === 'estorno' && (
              <div className="bg-amber-950/30 text-amber-400 text-[10px] p-3 rounded border border-amber-800/30">
                ⚠️ <strong>Estorno</strong>: A solicitação precisa ser <strong>aprovada</strong> e depois <strong>executada</strong> para reverter o pagamento. O valor será devolvido conforme método selecionado.
              </div>
            )}

            <div className="flex gap-2 pt-3 border-t border-slate-800">
              <button onClick={() => setShowForm(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 rounded text-xs">Cancelar</button>
              <button onClick={handleRequestCancellation} disabled={!formRecId || !formReason} className={`flex-1 font-semibold py-2 rounded text-xs ${!formRecId || !formReason ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>
                {formType === 'cancelamento' ? 'Cancelar Pagamento' : formType === 'estorno' ? 'Solicitar Estorno' : 'Solicitar Devolução'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CancellationRefund;

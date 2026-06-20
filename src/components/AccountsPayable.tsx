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

const CATEGORIES = ['Manutenção', 'Energia/Água', 'Folha de Pagamento', 'Impostos', 'Contratos', 'Seguros', 'Limpeza', 'Segurança', 'Administrativo', 'Outros'];
const RECURRENCE = ['Única', 'Mensal', 'Bimestral', 'Trimestral', 'Semestral', 'Anual'];
const PAYMENT_METHODS = ['PIX', 'Boleto', 'TED', 'Dinheiro', 'Débito Automático'];

export const AccountsPayable: React.FC = () => {
  const [payables, setPayables] = useState<PayableItem[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todas');
  const [filterCategory, setFilterCategory] = useState('Todas');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PayableItem | null>(null);

  // Form
  const [formCreditor, setFormCreditor] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formCategory, setFormCategory] = useState('Outros');
  const [formValue, setFormValue] = useState('');
  const [formRecurrence, setFormRecurrence] = useState('Única');
  const [formMethod, setFormMethod] = useState('PIX');

  const [stats, setStats] = useState({ pending: 0, overdue: 0, paid: 0, total: 0 });

  useEffect(() => { loadPayables(); }, []);

  const loadPayables = async () => {
    const { data } = await supabase.from('payables').select('*').order('created_at', { ascending: false });
    if (data) {
      const items = data as PayableItem[];
      setPayables(items);
      const now = new Date().toISOString().split('T')[0];
      setStats({
        pending: items.filter(i => i.status === 'Pendente').length,
        overdue: items.filter(i => i.status === 'Pendente' && i.due_date < now).length,
        paid: items.filter(i => i.status === 'Pago').length,
        total: items.reduce((s, i) => s + Number(i.value), 0)
      });
    }
  };

  const handleSave = async () => {
    if (!formCreditor || !formDescription || !formDueDate || !formValue) return alert('Preencha credor, descrição, vencimento e valor.');
    const payload = {
      creditor: formCreditor,
      description: formDescription,
      due_date: formDueDate,
      category: formCategory,
      value: parseFloat(formValue),
      recurrence: formRecurrence,
      status: 'Pendente'
    };
    if (editingItem) {
      const { error } = await supabase.from('payables').update(payload).eq('id', editingItem.id);
      if (error) return alert('Erro: ' + error.message);
    } else {
      const { error } = await supabase.from('payables').insert([payload]);
      if (error) return alert('Erro: ' + error.message);
    }
    resetForm();
    setShowForm(false);
    setEditingItem(null);
    loadPayables();
  };

  const handlePay = async (item: PayableItem) => {
    const method = prompt('Método de pagamento (PIX/Boleto/TED/Dinheiro):', item.payment_method || 'PIX');
    if (!method) return;
    const { error } = await supabase.from('payables').update({
      status: 'Pago',
      payment_method: method,
      payment_date: new Date().toISOString().split('T')[0]
    }).eq('id', item.id);
    if (error) return alert('Erro: ' + error.message);
    loadPayables();
  };

  const handleDelete = async (id: any) => {
    if (!confirm('Excluir esta conta a pagar?')) return;
    await supabase.from('payables').delete().eq('id', id);
    loadPayables();
  };

  const handleEdit = (item: PayableItem) => {
    setEditingItem(item);
    setFormCreditor(item.creditor);
    setFormDescription(item.description);
    setFormDueDate(item.due_date);
    setFormCategory(item.category);
    setFormValue(item.value.toString());
    setFormRecurrence(item.recurrence || 'Única');
    setShowForm(true);
  };

  const resetForm = () => {
    setFormCreditor(''); setFormDescription(''); setFormDueDate(''); setFormCategory('Outros');
    setFormValue(''); setFormRecurrence('Única'); setFormMethod('PIX');
  };

  const filtered = payables.filter(p => {
    const s = search.toLowerCase();
    const matchSearch = p.creditor.toLowerCase().includes(s) || p.description.toLowerCase().includes(s) || p.category.toLowerCase().includes(s);
    const matchStatus = filterStatus === 'Todas' || p.status === filterStatus;
    const matchCat = filterCategory === 'Todas' || p.category === filterCategory;
    return matchSearch && matchStatus && matchCat;
  });

  const pendingValue = payables.filter(p => p.status === 'Pendente').reduce((s, p) => s + Number(p.value), 0);
  const overdueValue = payables.filter(p => p.status === 'Pendente' && p.due_date < new Date().toISOString().split('T')[0]).reduce((s, p) => s + Number(p.value), 0);
  const paidValue = payables.filter(p => p.status === 'Pago').reduce((s, p) => s + Number(p.value), 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-white uppercase">📋 Contas a Pagar</h2>
        <button onClick={() => { setEditingItem(null); resetForm(); setShowForm(true); }} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded text-xs">+ Nova Conta</button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <p className="text-[9px] text-slate-400 uppercase font-bold">Previsto</p>
          <p className="text-lg font-bold text-white">R$ {pendingValue.toFixed(2)}</p>
          <p className="text-[9px] text-slate-500">{stats.pending} contas</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <p className="text-[9px] text-slate-400 uppercase font-bold">Vencidas</p>
          <p className="text-lg font-bold text-red-400">R$ {overdueValue.toFixed(2)}</p>
          <p className="text-[9px] text-red-400">{stats.overdue} contas</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <p className="text-[9px] text-slate-400 uppercase font-bold">Pagas</p>
          <p className="text-lg font-bold text-emerald-400">R$ {paidValue.toFixed(2)}</p>
          <p className="text-[9px] text-emerald-400">{stats.paid} contas</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <p className="text-[9px] text-slate-400 uppercase font-bold">Saldo Previsto</p>
          <p className={`text-lg font-bold ${pendingValue > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            R$ {(stats.total - pendingValue).toFixed(2)}
          </p>
          <p className="text-[9px] text-slate-500">líquido do mês</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="flex-1 min-w-[200px] bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white" placeholder="Buscar credor, descrição ou categoria..." />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white">
          <option value="Todas">Todos Status</option>
          <option value="Pendente">Pendente</option>
          <option value="Pago">Pago</option>
        </select>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white">
          <option value="Todas">Todas Categorias</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
            <tr>
              <th className="p-3 text-left">Credor</th>
              <th className="p-3 text-left">Descrição</th>
              <th className="p-3 text-left">Vencimento</th>
              <th className="p-3 text-left">Categoria</th>
              <th className="p-3 text-right">Valor</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Recorrência</th>
              <th className="p-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center p-6 text-slate-500">Nenhuma conta encontrada</td></tr>
            ) : filtered.map(p => {
              const overdue = p.status === 'Pendente' && p.due_date < new Date().toISOString().split('T')[0];
              return (
                <tr key={p.id} className="hover:bg-slate-800/30">
                  <td className="p-3 font-bold text-white">{p.creditor}</td>
                  <td className="p-3 text-slate-400 max-w-[200px] truncate">{p.description}</td>
                  <td className={`p-3 font-semibold ${overdue ? 'text-red-400' : 'text-blue-300'}`}>
                    {new Date(p.due_date).toLocaleDateString('pt-BR')}
                    {overdue && <span className="text-[9px] text-red-400 ml-1">⚠️</span>}
                  </td>
                  <td className="p-3"><span className="bg-slate-800 text-slate-300 text-[9px] px-1.5 py-0.5 rounded-full">{p.category}</span></td>
                  <td className="p-3 text-right font-bold font-mono text-white">R$ {Number(p.value).toFixed(2)}</td>
                  <td className="p-3">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${p.status === 'Pago' ? 'bg-emerald-500/10 text-emerald-400' : overdue ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                      {p.status === 'Pago' ? 'Pago' : overdue ? 'Vencida' : 'Pendente'}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400 text-[9px]">{p.recurrence || 'Única'}</td>
                  <td className="p-3">
                    <div className="flex justify-center gap-1">
                      {p.status !== 'Pago' && <button onClick={() => handlePay(p)} className="text-emerald-400 hover:text-emerald-300 p-0.5" title="Quitar">💰</button>}
                      <button onClick={() => handleEdit(p)} className="text-blue-400 hover:text-blue-300 p-0.5" title="Editar">✏️</button>
                      <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:text-red-300 p-0.5" title="Excluir">❌</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg w-full space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm uppercase">{editingItem ? 'Editar' : 'Nova'} Conta a Pagar</h3>
              <button onClick={() => { setShowForm(false); setEditingItem(null); }} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group col-span-2"><label className="form-label">Credor *</label><input type="text" value={formCreditor} onChange={e => setFormCreditor(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" placeholder="Nome do fornecedor" /></div>
              <div className="form-group col-span-2"><label className="form-label">Descrição *</label><input type="text" value={formDescription} onChange={e => setFormDescription(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" placeholder="Ex: Serviço de dedetização" /></div>
              <div className="form-group"><label className="form-label">Vencimento *</label><input type="date" value={formDueDate} onChange={e => setFormDueDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" /></div>
              <div className="form-group"><label className="form-label">Valor *</label><input type="number" step="0.01" value={formValue} onChange={e => setFormValue(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" /></div>
              <div className="form-group"><label className="form-label">Categoria</label><select value={formCategory} onChange={e => setFormCategory(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white">{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Recorrência</label><select value={formRecurrence} onChange={e => setFormRecurrence(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white">{RECURRENCE.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
            </div>
            {formRecurrence !== 'Única' && (
              <div className="bg-blue-950/30 text-blue-400 text-[10px] p-2 rounded border border-blue-800/30 font-bold">
                ⚡ Conta recorrente — será gerada automaticamente no próximo ciclo
              </div>
            )}
            <div className="flex gap-2 pt-3 border-t border-slate-800">
              <button onClick={() => { setShowForm(false); setEditingItem(null); }} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 rounded text-xs">Cancelar</button>
              <button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded text-xs">{editingItem ? 'Atualizar' : 'Criar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsPayable;

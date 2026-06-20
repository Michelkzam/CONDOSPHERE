import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

interface BankAccount {
  id: any;
  bank_name: string;
  agency: string;
  account_number: string;
  pix_key: string;
  pix_key_type: string;
  is_active: boolean;
}

interface ImportItem {
  id: any;
  import_id: any;
  transaction_date: string;
  description: string;
  document_number: string;
  amount: number;
  type: string;
  matched_receivable_id: any;
  match_confidence: number;
  match_status: string;
}

interface Import {
  id: any;
  bank_account_id: any;
  file_name: string;
  import_type: string;
  transaction_count: number;
  total_amount: number;
  imported_at: string;
}

interface Receivable {
  id: any;
  identifier: string;
  owner: string;
  dueDate: string;
  baseValue: number;
  status: string;
}

export const BankReconciliation: React.FC<{ receivables?: Receivable[] }> = ({ receivables = [] }) => {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [imports, setImports] = useState<Import[]>([]);
  const [items, setItems] = useState<ImportItem[]>([]);
  const [selectedImport, setSelectedImport] = useState<Import | null>(null);
  const [activeTab, setActiveTab] = useState<'accounts' | 'imports' | 'reconcile'>('accounts');
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importBankAccountId, setImportBankAccountId] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [importProgress, setImportProgress] = useState(0);

  // Account form
  const [formBank, setFormBank] = useState('');
  const [formAgency, setFormAgency] = useState('');
  const [formAccount, setFormAccount] = useState('');
  const [formPixKey, setFormPixKey] = useState('');
  const [formPixType, setFormPixType] = useState('cpf');

  // Filters
  const [filterStatus, setFilterStatus] = useState('todos');

  useEffect(() => {
    loadAccounts();
    loadImports();
  }, []);

  const loadAccounts = async () => {
    const { data } = await supabase.from('bank_accounts').select('*').order('bank_name');
    if (data) setAccounts(data as BankAccount[]);
  };

  const loadImports = async () => {
    const { data } = await supabase.from('reconciliation_imports').select('*').order('imported_at', { ascending: false });
    if (data) setImports(data as Import[]);
  };

  const loadItems = async (importId: any) => {
    const { data } = await supabase.from('reconciliation_items').select('*').eq('import_id', importId).order('transaction_date');
    if (data) setItems(data as ImportItem[]);
  };

  const handleSaveAccount = async () => {
    if (!formBank || !formAccount) return alert('Preencha banco e conta.');
    const payload = { bank_name: formBank, agency: formAgency, account_number: formAccount, pix_key: formPixKey, pix_key_type: formPixType, is_active: true };
    const { error } = await supabase.from('bank_accounts').insert([payload]);
    if (error) return alert('Erro: ' + error.message);
    setShowAccountForm(false);
    setFormBank(''); setFormAgency(''); setFormAccount(''); setFormPixKey(''); setFormPixType('cpf');
    loadAccounts();
  };

  const parseOFX = (text: string): any[] => {
    const transactions: any[] = [];
    const stmttrnBlocks = text.split('<STMTTRN>');
    for (let i = 1; i < stmttrnBlocks.length; i++) {
      const block = stmttrnBlocks[i].split('</STMTTRN>')[0];
      const getTag = (tag: string) => { const m = block.match(new RegExp(`<${tag}>([^<]*)`)); return m ? m[1].trim() : ''; };
      const type = getTag('TRNTYPE');
      const dateStr = getTag('DTPOSTED');
      const amount = parseFloat(getTag('TRNAMT'));
      const memo = getTag('MEMO');
      if (dateStr && !isNaN(amount)) {
        const date = dateStr.slice(0, 4) + '-' + dateStr.slice(4, 6) + '-' + dateStr.slice(6, 8);
        transactions.push({ transaction_date: date, description: memo, amount: Math.abs(amount), type: amount >= 0 ? 'credit' : 'debit', document_number: getTag('FITID').slice(0, 20) });
      }
    }
    return transactions;
  };

  const parseCNAB400 = (text: string): any[] => {
    const transactions: any[] = [];
    const lines = text.split('\n').filter(l => l.length >= 400);
    for (const line of lines) {
      if (line[0] === '1') {
        const value = parseFloat(line.slice(121, 134)) / 100;
        const rawDate = line.slice(17, 23);
        const date = '20' + rawDate.slice(0, 2) + '-' + rawDate.slice(2, 4) + '-' + rawDate.slice(4, 6);
        const desc = line.slice(146, 176).trim();
        const doc = line.slice(70, 80).trim();
        const type = line[13] === '0' ? 'debit' : line[13] === '1' ? 'credit' : 'credit';
        if (!isNaN(value) && date.length === 10) {
          transactions.push({ transaction_date: date, description: desc || `Transação ${doc}`, amount: value, type, document_number: doc });
        }
      }
    }
    return transactions;
  };

  const parseCNAB240 = (text: string): any[] => {
    const transactions: any[] = [];
    const lines = text.split('\n');
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (!line || line.length < 240) { i++; continue; }
      if (line[13] === 'J') {
        const desc = line.slice(82, 132).trim();
        const doc = line.slice(72, 82).trim();
        const rawDate = lines[i + 1]?.slice(46, 54) || '';
        const date = rawDate.length === 8 ? rawDate.slice(0, 4) + '-' + rawDate.slice(4, 6) + '-' + rawDate.slice(6, 8) : '';
        const value = parseFloat(lines[i + 1]?.slice(54, 70)) / 100;
        const type = 'credit';
        if (date && !isNaN(value)) {
          transactions.push({ transaction_date: date, description: desc || `Doc ${doc}`, amount: value, type, document_number: doc });
        }
      }
      i++;
    }
    return transactions;
  };

  const parseCSV = (text: string): any[] => {
    const transactions: any[] = [];
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) return transactions;
    const headers = lines[0].toLowerCase().split(',');
    const dateIdx = headers.findIndex(h => h.includes('data') || h.includes('date'));
    const descIdx = headers.findIndex(h => h.includes('desc') || h.includes('historico') || h.includes('memorando'));
    const valIdx = headers.findIndex(h => h.includes('valor') || h.includes('value') || h.includes('amount'));
    if (dateIdx === -1 || valIdx === -1) return transactions;
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',');
      const rawDate = cols[dateIdx]?.replace(/"/g, '').trim();
      const desc = cols[descIdx]?.replace(/"/g, '').trim() || '';
      const rawValue = cols[valIdx]?.replace(/["R$\s]/g, '').replace(',', '.').trim();
      const value = parseFloat(rawValue);
      if (!rawDate || isNaN(value)) continue;
      const parts = rawDate.split(/[/-]/);
      const date = parts.length === 3 ? `${parts[2].length === 4 ? parts[2] : '20' + parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}` : rawDate;
      transactions.push({ transaction_date: date, description: desc, amount: Math.abs(value), type: value >= 0 ? 'credit' : 'debit', document_number: '' });
    }
    return transactions;
  };

  const autoMatch = async (items: any[], importId: string) => {
    const pending = receivables.filter(r => r.status === 'Pendente' || r.status === 'Vencido');
    const results: any[] = [];
    for (const item of items) {
      let bestMatch: any = null;
      let bestScore = 0;
      for (const rec of pending) {
        let score = 0;
        if (Math.abs(item.amount - rec.baseValue) < 0.05) score += 60;
        if (rec.dueDate && item.transaction_date) {
          const diff = Math.abs(new Date(item.transaction_date).getTime() - new Date(rec.dueDate).getTime()) / (1000 * 86400);
          if (diff <= 5) score += 30;
          if (diff <= 15) score += 15;
        }
        if (item.description && rec.owner) {
          const descLower = item.description.toLowerCase();
          const ownerLower = rec.owner.toLowerCase();
          if (descLower.includes(ownerLower) || ownerLower.includes(descLower)) score += 20;
          if (rec.identifier && descLower.includes(rec.identifier.toLowerCase())) score += 10;
        }
        if (item.document_number && rec.id && item.document_number.includes(String(rec.id).slice(0, 8))) score += 40;
        if (score > bestScore) { bestScore = score; bestMatch = rec; }
      }
      results.push({
        import_id: importId,
        transaction_date: item.transaction_date || new Date().toISOString().split('T')[0],
        description: item.description || 'Importado',
        document_number: item.document_number || '',
        amount: item.amount || 0,
        type: item.type || 'credit',
        matched_receivable_id: bestMatch && bestScore >= 60 ? bestMatch.id : null,
        match_confidence: Math.min(bestScore, 100),
        match_status: bestMatch && bestScore >= 60 ? 'auto_matched' : 'unmatched'
      });
    }
    return results;
  };

  const handleImport = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return alert('Selecione um arquivo');
    if (!importBankAccountId) return alert('Selecione a conta bancária de destino.');

    setImportStatus('Lendo arquivo...');
    setImportProgress(10);
    
    const text = await file.text();
    setImportProgress(30);

    let transactions: any[] = [];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'ofx' || ext === 'ofc') {
      transactions = parseOFX(text);
    } else if (ext === 'txt' || ext === 'ret' || ext === 'cnaB') {
      transactions = text.length >= 400 && text.length <= 500 ? parseCNAB400(text) : parseCNAB240(text);
    } else if (ext === 'csv') {
      transactions = parseCSV(text);
    } else {
      return alert('Formato não suportado. Use OFX, CNAB (txt/ret) ou CSV.');
    }

    if (transactions.length === 0) return alert('Nenhuma transação encontrada no arquivo. Verifique o formato.');

    setImportStatus(`Processando ${transactions.length} transações...`);
    setImportProgress(50);

    const totalAmount = transactions.reduce((s: number, t: any) => s + Math.abs(t.amount || 0), 0);
    const creditCount = transactions.filter((t: any) => t.type === 'credit').length;
    const debitCount = transactions.filter((t: any) => t.type === 'debit').length;

    const { data: imp, error: impErr } = await supabase.from('reconciliation_imports').insert([{
      bank_account_id: importBankAccountId,
      file_name: file.name,
      import_type: ext === 'csv' ? 'csv_extract' : ext === 'ofx' ? 'ofx_statement' : 'cnab_file',
      transaction_count: transactions.length,
      total_amount: totalAmount,
      status: 'processing'
    }]).select();
    if (impErr) return alert('Erro ao criar importação: ' + impErr.message);
    if (!imp?.[0]) return;

    setImportProgress(70);
    setImportStatus('Realizando matching automático...');

    const matchedItems = await autoMatch(transactions, imp[0].id);
    const { error: itemsErr } = await supabase.from('reconciliation_items').insert(matchedItems);
    if (itemsErr) return alert('Erro ao salvar itens: ' + itemsErr.message);

    await supabase.from('reconciliation_imports').update({ status: 'completed' }).eq('id', imp[0].id);

    setImportProgress(100);
    setImportStatus('');
    loadImports();
    setShowImportModal(false);
    setImportBankAccountId('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    const matchedCount = matchedItems.filter((m: any) => m.match_status === 'auto_matched').length;
    alert(`✅ ${file.name} importado!\n${transactions.length} transações (${creditCount} créditos, ${debitCount} débitos)\n${matchedCount} match automático(s)`);
  };

  const confirmMatch = async (itemId: any, receivableId: any) => {
    await supabase.from('reconciliation_items').update({
      matched_receivable_id: receivableId,
      match_status: 'confirmed',
      match_confidence: 100
    }).eq('id', itemId);
    if (selectedImport) loadItems(selectedImport.id);
  };

  const unlinkItem = async (itemId: any) => {
    await supabase.from('reconciliation_items').update({
      matched_receivable_id: null,
      match_status: 'unmatched',
      match_confidence: 0
    }).eq('id', itemId);
    if (selectedImport) loadItems(selectedImport.id);
  };

  const toggleAccount = async (a: BankAccount) => {
    await supabase.from('bank_accounts').update({ is_active: !a.is_active }).eq('id', a.id);
    loadAccounts();
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      confirmed: 'bg-green-500/10 text-green-400',
      auto_matched: 'bg-blue-500/10 text-blue-400',
      unmatched: 'bg-amber-500/10 text-amber-400',
      ignored: 'bg-slate-500/10 text-slate-400'
    };
    return map[status] || 'bg-slate-500/10 text-slate-400';
  };

  const filteredItems = items.filter(i => {
    if (filterStatus === 'todos') return true;
    return i.match_status === filterStatus;
  });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white uppercase">🏦 Conciliação Bancária</h2>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 rounded-lg p-1 max-w-md border border-slate-800">
        {(['accounts', 'imports', 'reconcile'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            {tab === 'accounts' ? '🏦 Contas' : tab === 'imports' ? '📥 Importações' : '🔗 Conciliar'}
          </button>
        ))}
      </div>

      {/* Accounts Tab */}
      {activeTab === 'accounts' && (
        <>
          <div className="flex justify-end">
            <button onClick={() => setShowAccountForm(true)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded text-xs">+ Nova Conta</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {accounts.map(a => (
              <div key={a.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white text-sm">{a.bank_name}</h4>
                    <p className="text-[10px] text-slate-400 font-mono">Ag {a.agency} • CC {a.account_number}</p>
                  </div>
                  <button onClick={() => toggleAccount(a)} className={`text-[9px] px-2 py-1 rounded font-bold ${a.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {a.is_active ? 'Ativa' : 'Inativa'}
                  </button>
                </div>
                {a.pix_key && (
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <p className="text-[9px] text-slate-500 uppercase font-bold">Chave PIX</p>
                    <p className="text-xs font-mono text-blue-400 truncate">{a.pix_key} <span className="text-[9px] text-slate-500">({a.pix_key_type})</span></p>
                  </div>
                )}
              </div>
            ))}
            {accounts.length === 0 && <p className="text-xs text-slate-500 col-span-2 text-center py-8">Nenhuma conta bancária cadastrada</p>}
          </div>
        </>
      )}

      {/* Imports Tab */}
      {activeTab === 'imports' && (
        <>
          <div className="flex justify-end">
            <button onClick={() => setShowImportModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded text-xs">+ Importar Arquivo</button>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3 text-left">Arquivo</th>
                  <th className="p-3 text-left">Tipo</th>
                  <th className="p-3 text-left">Transações</th>
                  <th className="p-3 text-left">Valor Total</th>
                  <th className="p-3 text-left">Importado em</th>
                  <th className="p-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {imports.map(imp => (
                  <tr key={imp.id} className="hover:bg-slate-800/30 cursor-pointer" onClick={() => { setSelectedImport(imp); loadItems(imp.id); setActiveTab('reconcile'); }}>
                    <td className="p-3 font-bold text-white">{imp.file_name}</td>
                    <td className="p-3 uppercase">{imp.import_type}</td>
                    <td className="p-3">{imp.transaction_count}</td>
                    <td className="p-3 font-mono">R$ {Number(imp.total_amount).toFixed(2)}</td>
                    <td className="p-3 text-slate-500">{new Date(imp.imported_at).toLocaleString('pt-BR')}</td>
                    <td className="p-3 text-center">
                      <button onClick={(e) => { e.stopPropagation(); setSelectedImport(imp); loadItems(imp.id); setActiveTab('reconcile'); }} className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded text-[9px] font-bold">Conciliar</button>
                    </td>
                  </tr>
                ))}
                {imports.length === 0 && <tr><td colSpan={6} className="text-center p-4 text-slate-500">Nenhuma importação realizada</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Reconciliation Tab */}
      {activeTab === 'reconcile' && (
        <>
          <div className="flex gap-2 items-center bg-slate-900 border border-slate-800 rounded-lg p-3">
            <span className="text-xs font-bold text-white uppercase">Filtrar:</span>
            {['todos', 'confirmed', 'auto_matched', 'unmatched', 'ignored'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`text-[9px] font-bold px-2 py-1 rounded uppercase ${filterStatus === s ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                {s === 'todos' ? 'Todos' : s === 'confirmed' ? '✅ Confirmados' : s === 'auto_matched' ? '🤖 Automáticos' : s === 'unmatched' ? '⚠️ Pendentes' : 'Ignorados'}
              </button>
            ))}
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3 text-left">Data</th>
                  <th className="p-3 text-left">Descrição</th>
                  <th className="p-3 text-left">Doc</th>
                  <th className="p-3 text-right">Valor</th>
                  <th className="p-3 text-left">Tipo</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Confiança</th>
                  <th className="p-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-800/30">
                    <td className="p-3 text-slate-400">{item.transaction_date}</td>
                    <td className="p-3 max-w-[200px] truncate">{item.description}</td>
                    <td className="p-3 font-mono text-slate-500 text-[9px]">{item.document_number?.slice(0, 12) || '-'}</td>
                    <td className="p-3 text-right font-mono font-bold text-white">R$ {Number(item.amount).toFixed(2)}</td>
                    <td className="p-3 uppercase">{item.type === 'credit' ? '💰 Crédito' : '💳 Débito'}</td>
                    <td className="p-3"><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${statusBadge(item.match_status)}`}>{item.match_status}</span></td>
                    <td className="p-3">{item.match_confidence}%</td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-1">
                        {item.match_status === 'unmatched' && (
                          <select onChange={e => e.target.value && confirmMatch(item.id, e.target.value)} className="bg-slate-950 border border-slate-800 rounded p-1 text-[9px] text-white max-w-[100px]">
                            <option value="">Vincular...</option>
                            {receivables.filter(r => r.status === 'Pendente' || r.status === 'Vencido').map(r => (
                              <option key={r.id} value={r.id}>{r.owner} - R$ {r.baseValue.toFixed(2)}</option>
                            ))}
                          </select>
                        )}
                        {item.match_status !== 'unmatched' && (
                          <button onClick={() => unlinkItem(item.id)} className="bg-red-600/50 hover:bg-red-600 text-white px-1.5 py-0.5 rounded text-[9px] font-bold">Desvincular</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && <tr><td colSpan={8} className="text-center p-4 text-slate-500">Selecione uma importação para reconciliar</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Account Form Modal */}
      {showAccountForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm uppercase">Nova Conta Bancária</h3>
              <button onClick={() => setShowAccountForm(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group col-span-2"><label className="form-label">Banco *</label><input type="text" value={formBank} onChange={e => setFormBank(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" placeholder="Ex: Banco do Brasil" /></div>
              <div className="form-group"><label className="form-label">Agência</label><input type="text" value={formAgency} onChange={e => setFormAgency(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" /></div>
              <div className="form-group"><label className="form-label">Conta *</label><input type="text" value={formAccount} onChange={e => setFormAccount(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" /></div>
              <div className="form-group"><label className="form-label">Chave PIX</label><input type="text" value={formPixKey} onChange={e => setFormPixKey(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" /></div>
              <div className="form-group"><label className="form-label">Tipo PIX</label><select value={formPixType} onChange={e => setFormPixType(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"><option value="cpf">CPF</option><option value="cnpj">CNPJ</option><option value="email">Email</option><option value="telefone">Telefone</option><option value="aleatoria">Aleatória</option></select></div>
            </div>
            <div className="flex gap-2 pt-3 border-t border-slate-800">
              <button onClick={() => setShowAccountForm(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 rounded text-xs">Cancelar</button>
              <button onClick={handleSaveAccount} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded text-xs">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm uppercase">Importar Extrato</h3>
              <button onClick={() => { setShowImportModal(false); setImportStatus(''); }} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <p className="text-slate-400">Formatos suportados: OFX, CNAB240, CNAB400, CSV</p>
            {importStatus && (
              <div className="bg-blue-950/30 text-blue-400 text-[10px] p-2 rounded border border-blue-800/30 font-bold">
                {importStatus} {importProgress > 0 && <span>({importProgress}%)</span>}
                {importProgress > 0 && importProgress < 100 && (
                  <div className="w-full bg-slate-950 rounded-full h-1 mt-1">
                    <div className="bg-blue-500 h-1 rounded-full transition-all" style={{ width: `${importProgress}%` }} />
                  </div>
                )}
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Conta de destino *</label>
              <select value={importBankAccountId} onChange={e => setImportBankAccountId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white">
                <option value="">Selecione...</option>
                {accounts.filter(a => a.is_active).map(a => <option key={a.id} value={a.id}>{a.bank_name} - {a.account_number}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Arquivo *</label>
              <input ref={fileInputRef} type="file" accept=".ofx,.ofc,.txt,.ret,.csv,.xml" className="w-full text-xs text-slate-300 file:bg-slate-800 file:text-white file:border-0 file:rounded file:px-3 file:py-1 file:text-xs file:font-bold hover:file:bg-slate-700" />
            </div>
            <div className="flex gap-2 pt-3 border-t border-slate-800">
              <button onClick={() => { setShowImportModal(false); setImportStatus(''); }} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 rounded text-xs">Cancelar</button>
              <button onClick={handleImport} disabled={!!importStatus} className={`flex-1 font-semibold py-2 rounded text-xs ${importStatus ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>
                {importStatus ? 'Processando...' : 'Importar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankReconciliation;

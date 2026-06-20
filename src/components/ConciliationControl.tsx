import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface AccountNode {
  id: string;
  code: string;
  name: string;
  type: 'receita' | 'despesa';
  parent_id: string | null;
}

interface Fund {
  id: string;
  name: string;
  description: string;
  balance: number;
  color: string;
  created_at: string;
}

interface FundTransaction {
  id: string;
  fund_id: string;
  type: 'credit' | 'debit';
  description: string;
  value: number;
  date: string;
}

const DEFAULT_ACCOUNTS: AccountNode[] = [
  { id: '1', code: '1', name: 'RECEITAS CONDOMINIAIS', type: 'receita', parent_id: null },
  { id: '1.1', code: '1.1', name: 'Taxas Ordinárias Mensais', type: 'receita', parent_id: '1' },
  { id: '1.2', code: '1.2', name: 'Taxas Extras (Obras, Reservas)', type: 'receita', parent_id: '1' },
  { id: '1.3', code: '1.3', name: 'Multas e Notificações', type: 'receita', parent_id: '1' },
  { id: '1.4', code: '1.4', name: 'Juros e Correção Monetária', type: 'receita', parent_id: '1' },
  { id: '2', code: '2', name: 'DESPESAS E CUSTOS', type: 'despesa', parent_id: null },
  { id: '2.1', code: '2.1', name: 'Despesas Operacionais (Energia, Água)', type: 'despesa', parent_id: '2' },
  { id: '2.2', code: '2.2', name: 'Folha Salarial (CLT, Encargos)', type: 'despesa', parent_id: '2' },
  { id: '2.3', code: '2.3', name: 'Contratos Terceirizados', type: 'despesa', parent_id: '2' },
  { id: '2.4', code: '2.4', name: 'Manutenção e Conservação', type: 'despesa', parent_id: '2' },
  { id: '2.5', code: '2.5', name: 'Impostos e Taxas', type: 'despesa', parent_id: '2' },
  { id: '2.6', code: '2.6', name: 'Seguros', type: 'despesa', parent_id: '2' },
];

export const ConciliationControl: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'conciliacao' | 'plano' | 'fundos'>('conciliacao');

  // Chart of accounts
  const [accounts, setAccounts] = useState<AccountNode[]>(() => {
    const saved = localStorage.getItem('condosphere_chart_of_accounts');
    return saved ? JSON.parse(saved) : DEFAULT_ACCOUNTS;
  });
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [acctCode, setAcctCode] = useState('');
  const [acctName, setAcctName] = useState('');
  const [acctType, setAcctType] = useState<'receita' | 'despesa'>('receita');
  const [acctParent, setAcctParent] = useState('');

  // Funds
  const [funds, setFunds] = useState<Fund[]>(() => {
    const saved = localStorage.getItem('condosphere_funds');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Fundo de Reserva', description: '5% das mensalidades ordinárias', balance: 45200, color: '#3b82f6', created_at: '2026-01-01' },
      { id: '2', name: 'Fundo de Obras', description: 'Rateio extra para melhorias', balance: 18900, color: '#f59e0b', created_at: '2026-01-01' },
    ];
  });
  const [showFundForm, setShowFundForm] = useState(false);
  const [showTransForm, setShowTransForm] = useState(false);
  const [selectedFund, setSelectedFund] = useState<Fund | null>(null);
  const [fundName, setFundName] = useState('');
  const [fundDesc, setFundDesc] = useState('');
  const [fundColor, setFundColor] = useState('#3b82f6');
  const [fundBalance, setFundBalance] = useState('');

  // Transactions
  const [transactions, setTransactions] = useState<FundTransaction[]>(() => {
    const saved = localStorage.getItem('condosphere_fund_transactions');
    return saved ? JSON.parse(saved) : [];
  });
  const [transType, setTransType] = useState<'credit' | 'debit'>('credit');
  const [transDesc, setTransDesc] = useState('');
  const [transValue, setTransValue] = useState('');

  useEffect(() => {
    localStorage.setItem('condosphere_chart_of_accounts', JSON.stringify(accounts));
  }, [accounts]);
  useEffect(() => {
    localStorage.setItem('condosphere_funds', JSON.stringify(funds));
  }, [funds]);
  useEffect(() => {
    localStorage.setItem('condosphere_fund_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Account management
  const handleAddAccount = () => {
    if (!acctCode || !acctName) return alert('Código e nome são obrigatórios.');
    const newAcct: AccountNode = { id: Date.now().toString(), code: acctCode, name: acctName, type: acctType, parent_id: acctParent || null };
    setAccounts(prev => [...prev, newAcct]);
    setShowAccountForm(false);
    resetAccountForm();
  };
  const handleDeleteAccount = (id: string) => {
    if (confirm('Excluir esta conta do plano?')) setAccounts(prev => prev.filter(a => a.id !== id && a.parent_id !== id));
  };
  const resetAccountForm = () => { setAcctCode(''); setAcctName(''); setAcctType('receita'); setAcctParent(''); };

  // Fund management
  const handleAddFund = () => {
    if (!fundName) return alert('Nome do fundo é obrigatório.');
    const newFund: Fund = { id: Date.now().toString(), name: fundName, description: fundDesc, balance: parseFloat(fundBalance) || 0, color: fundColor, created_at: new Date().toISOString() };
    setFunds(prev => [...prev, newFund]);
    setShowFundForm(false);
    setFundName(''); setFundDesc(''); setFundColor('#3b82f6'); setFundBalance('');
  };
  const handleAddTransaction = () => {
    if (!selectedFund || !transDesc || !transValue) return alert('Preencha todos os campos.');
    const val = parseFloat(transValue);
    if (transType === 'debit' && val > selectedFund.balance) return alert('Saldo insuficiente no fundo.');
    const newTrans: FundTransaction = { id: Date.now().toString(), fund_id: selectedFund.id, type: transType, description: transDesc, value: val, date: new Date().toISOString() };
    setTransactions(prev => [...prev, newTrans]);
    setFunds(prev => prev.map(f => f.id === selectedFund.id ? { ...f, balance: f.balance + (transType === 'credit' ? val : -val) } : f));
    setShowTransForm(false);
    setTransDesc(''); setTransValue(''); setTransType('credit');
  };
  const handleDeleteFund = (id: string) => {
    if (confirm('Excluir este fundo (todas as transações serão perdidas)?')) {
      setFunds(prev => prev.filter(f => f.id !== id));
      setTransactions(prev => prev.filter(t => t.fund_id !== id));
    }
  };
  const fundTotal = funds.reduce((s, f) => s + f.balance, 0);
  const fundTrans = selectedFund ? transactions.filter(t => t.fund_id === selectedFund.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white uppercase">⚖️ Conciliação & Controle</h2>

      <div className="flex gap-1 bg-slate-900 rounded-lg p-1 max-w-md border border-slate-800">
        {(['conciliacao', 'plano', 'fundos'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            {tab === 'conciliacao' ? '🔗 Conciliação' : tab === 'plano' ? '📋 Plano de Contas' : '🏦 Fundos'}
          </button>
        ))}
      </div>

      {/* Conciliação Bancária Tab */}
      {activeTab === 'conciliacao' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-white text-sm uppercase">Status da Conciliação</h3>
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('plano'); }} className="text-blue-400 hover:text-blue-300 text-[10px] font-bold uppercase">Configurar Contas →</a>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-center">
              <p className="text-[9px] text-slate-400 uppercase font-bold">Receitas</p>
              <p className="text-lg font-bold text-emerald-400 mt-1">R$ 0,00</p>
              <p className="text-[9px] text-slate-500">a conciliar</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-center">
              <p className="text-[9px] text-slate-400 uppercase font-bold">Despesas</p>
              <p className="text-lg font-bold text-red-400 mt-1">R$ 0,00</p>
              <p className="text-[9px] text-slate-500">a conciliar</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-center">
              <p className="text-[9px] text-slate-400 uppercase font-bold">Diferença</p>
              <p className="text-lg font-bold text-white mt-1">R$ 0,00</p>
              <p className="text-[9px] text-slate-500">saldo líquido</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 text-center">
            Utilize o módulo <strong className="text-blue-400">Conciliação Bancária (🏦)</strong> no menu Financeiro para importar extratos CNAB/OFX e realizar o matching automático com receitas e despesas.
          </p>
        </div>
      )}

      {/* Plano de Contas Tab */}
      {activeTab === 'plano' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-white text-sm uppercase">Plano de Contas</h3>
            <button onClick={() => setShowAccountForm(true)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded text-[10px]">+ Adicionar Conta</button>
          </div>

          <div className="space-y-1 text-xs">
            {accounts.filter(a => !a.parent_id).map(parent => (
              <div key={parent.id}>
                <div className="flex justify-between items-center py-1.5 px-2 bg-slate-950 rounded border border-slate-800 mb-1">
                  <span className={`font-bold ${parent.type === 'receita' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {parent.code}. {parent.name}
                  </span>
                  <button onClick={() => handleDeleteAccount(parent.id)} className="text-red-400 hover:text-red-300 text-[9px] opacity-50 hover:opacity-100">✕</button>
                </div>
                {accounts.filter(a => a.parent_id === parent.id).map(child => (
                  <div key={child.id} className="flex justify-between items-center py-1 pl-6 pr-2 text-slate-300 hover:bg-slate-950/50 rounded">
                    <span>{child.code}. {child.name}</span>
                    <button onClick={() => handleDeleteAccount(child.id)} className="text-red-400 hover:text-red-300 text-[9px] opacity-30 hover:opacity-100">✕</button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fundos Tab */}
      {activeTab === 'fundos' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-white text-sm uppercase">Gestão de Fundos</h3>
              <p className="text-[9px] text-slate-400">Saldo total: <strong className="text-white">R$ {fundTotal.toFixed(2)}</strong></p>
            </div>
            <button onClick={() => setShowFundForm(true)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded text-[10px]">+ Novo Fundo</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {funds.map(fund => (
              <div key={fund.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3" style={{ borderLeftColor: fund.color, borderLeftWidth: 3 }}>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white text-sm">{fund.name}</h4>
                    <p className="text-[10px] text-slate-400">{fund.description}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setSelectedFund(fund); setShowTransForm(true); }} className="bg-emerald-700 hover:bg-emerald-600 text-white px-2 py-1 rounded text-[9px] font-bold">+ Transação</button>
                    <button onClick={() => handleDeleteFund(fund.id)} className="text-red-400 hover:text-red-300 text-[9px]">✕</button>
                  </div>
                </div>
                <p className="text-2xl font-extrabold" style={{ color: fund.color }}>R$ {fund.balance.toFixed(2)}</p>

                {/* Mini extrato */}
                <div className="border-t border-slate-800 pt-2 max-h-32 overflow-y-auto space-y-1">
                  {transactions.filter(t => t.fund_id === fund.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5).map(t => (
                    <div key={t.id} className="flex justify-between items-center text-[10px]">
                      <div>
                        <span className={t.type === 'credit' ? 'text-emerald-400' : 'text-red-400'}>
                          {t.type === 'credit' ? '💰' : '💳'}
                        </span>
                        <span className="text-slate-300 ml-1">{t.description}</span>
                      </div>
                      <span className={`font-mono font-bold ${t.type === 'credit' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {t.type === 'credit' ? '+' : '-'}R$ {t.value.toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {transactions.filter(t => t.fund_id === fund.id).length === 0 && (
                    <p className="text-[9px] text-slate-500 text-center py-1">Nenhuma transação ainda</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Account Form Modal */}
      {showAccountForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm uppercase">Nova Conta Contábil</h3>
              <button onClick={() => { setShowAccountForm(false); resetAccountForm(); }} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-3">
              <div className="form-group"><label className="form-label">Código *</label><input type="text" value={acctCode} onChange={e => setAcctCode(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" placeholder="Ex: 3.1" /></div>
              <div className="form-group"><label className="form-label">Nome *</label><input type="text" value={acctName} onChange={e => setAcctName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" placeholder="Ex: Receitas de Multas" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div className="form-group"><label className="form-label">Tipo</label><select value={acctType} onChange={e => setAcctType(e.target.value as any)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"><option value="receita">Receita</option><option value="despesa">Despesa</option></select></div>
                <div className="form-group"><label className="form-label">Conta Pai</label><select value={acctParent} onChange={e => setAcctParent(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"><option value="">Nenhum (raiz)</option>{accounts.filter(a => !a.parent_id).map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}</select></div>
              </div>
            </div>
            <div className="flex gap-2 pt-3 border-t border-slate-800">
              <button onClick={() => { setShowAccountForm(false); resetAccountForm(); }} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 rounded text-xs">Cancelar</button>
              <button onClick={handleAddAccount} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded text-xs">Adicionar</button>
            </div>
          </div>
        </div>
      )}

      {/* Fund Form Modal */}
      {showFundForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm uppercase">Novo Fundo</h3>
              <button onClick={() => setShowFundForm(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-3">
              <div className="form-group"><label className="form-label">Nome *</label><input type="text" value={fundName} onChange={e => setFundName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" placeholder="Ex: Fundo de Reserva" /></div>
              <div className="form-group"><label className="form-label">Descrição</label><input type="text" value={fundDesc} onChange={e => setFundDesc(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div className="form-group"><label className="form-label">Saldo Inicial</label><input type="number" step="0.01" value={fundBalance} onChange={e => setFundBalance(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" /></div>
                <div className="form-group"><label className="form-label">Cor</label><input type="color" value={fundColor} onChange={e => setFundColor(e.target.value)} className="w-full h-[38px] bg-slate-950 border border-slate-800 rounded p-1 cursor-pointer" /></div>
              </div>
            </div>
            <div className="flex gap-2 pt-3 border-t border-slate-800">
              <button onClick={() => setShowFundForm(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 rounded text-xs">Cancelar</button>
              <button onClick={handleAddFund} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded text-xs">Criar Fundo</button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Form Modal */}
      {showTransForm && selectedFund && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm uppercase">Transação: {selectedFund.name}</h3>
              <button onClick={() => setShowTransForm(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <p className="text-slate-400">Saldo atual: <strong className="text-white">R$ {selectedFund.balance.toFixed(2)}</strong></p>
            <div className="space-y-3">
              <div className="form-group"><label className="form-label">Tipo</label>
                <div className="flex gap-2">
                  <button onClick={() => setTransType('credit')} className={`flex-1 py-2 rounded text-xs font-bold uppercase ${transType === 'credit' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}>💰 Entrada</button>
                  <button onClick={() => setTransType('debit')} className={`flex-1 py-2 rounded text-xs font-bold uppercase ${transType === 'debit' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'}`}>💳 Saída</button>
                </div>
              </div>
              <div className="form-group"><label className="form-label">Descrição *</label><input type="text" value={transDesc} onChange={e => setTransDesc(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" placeholder="Ex: Depósito mensal 5%" /></div>
              <div className="form-group"><label className="form-label">Valor *</label><input type="number" step="0.01" value={transValue} onChange={e => setTransValue(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" /></div>
            </div>
            <div className="flex gap-2 pt-3 border-t border-slate-800">
              <button onClick={() => setShowTransForm(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 rounded text-xs">Cancelar</button>
              <button onClick={handleAddTransaction} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded text-xs">Registrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConciliationControl;

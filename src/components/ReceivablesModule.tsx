import React, { useState } from 'react';

export const ReceivablesModule: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'emissao' | 'baixa' | 'inadimplencia'>('emissao');
  const [billingType, setCategoryType] = useState('Ordinária');
  const [billingScope, setScope] = useState('Lote'); // 'Lote', 'Avulso', 'Associados', 'Nao_Associados'
  const [importLogs, setImportLogs] = useState<string[]>([
    "Processamento: Arquivo RET_SICOOB_1106.ret carregado. 45 faturas conciliadas.",
    "API Sync: Webhook recebido - Fatura Lote 12 liquidada via PIX instantâneo."
  ]);

  const handleIssueCharges = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Faturamento ${billingType} gerado com sucesso para ${billingScope}!`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setImportLogs(prev => [
        `Arquivo ${e.target.files![0].name} processado: 12 conciliações executadas.`,
        ...prev
      ]);
      alert("Arquivo de retorno processado!");
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg text-slate-100 space-y-6">
      
      {/* Sub Tabs Selector */}
      <div className="flex border-b border-slate-800 pb-2 gap-4">
        <button 
          onClick={() => setActiveSubTab('emissao')} 
          className={`pb-2 text-xs font-bold uppercase transition-colors ${activeSubTab === 'emissao' ? 'border-b-2 border-blue-500 text-white' : 'text-slate-500'}`}
        >
          Emissão de Cobrança
        </button>
        <button 
          onClick={() => setActiveSubTab('baixa')} 
          className={`pb-2 text-xs font-bold uppercase transition-colors ${activeSubTab === 'baixa' ? 'border-b-2 border-blue-500 text-white' : 'text-slate-500'}`}
        >
          Baixa de Boletos / PIX
        </button>
        <button 
          onClick={() => setActiveSubTab('inadimplencia')} 
          className={`pb-2 text-xs font-bold uppercase transition-colors ${activeSubTab === 'inadimplencia' ? 'border-b-2 border-blue-500 text-white' : 'text-slate-500'}`}
        >
          Controle de Inadimplência
        </button>
      </div>

      {/* SUB TAB: EMISSÃO COBRANÇA */}
      {activeSubTab === 'emissao' && (
        <form onSubmit={handleIssueCharges} className="space-y-4 max-w-lg">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Faturamento Condominial</h3>
          <p className="text-xs text-slate-400">Geração de cota mensal ordinária ou taxas extras integradas ao Sicoob v2.</p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Natureza da Taxa</label>
              <select value={billingType} onChange={e => setCategoryType(e.target.value)} className="w-full text-xs bg-slate-950 border border-slate-800 p-2.5 rounded text-white">
                <option value="Ordinária">Cota Ordinária Mensal</option>
                <option value="Fundo de Obras">Rateio Fundo de Obras</option>
                <option value="Reserva de Área">Taxa Reserva de Espaço</option>
                {/* New requested options */}
                <option value="Taxa Extra">Taxa Extra</option>
                <option value="Taxa Extra - 13º Funcionários">Taxa Extra - 13º Funcionários</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Escopo do Faturamento</label>
              <select value={billingScope} onChange={e => setScope(e.target.value)} className="w-full text-xs bg-slate-950 border border-slate-800 p-2.5 rounded text-white">
                <option value="Lote">Em Lote (Todas as Unidades)</option>
                <option value="Avulso">Lançamento Individual (Avulso)</option>
                {/* New requested options */}
                <option value="Associados">Faturar Associados</option>
                <option value="Nao_Associados">Faturar Não Associados</option>
              </select>
            </div>
          </div>

          <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 px-6 rounded transition-transform">
            ⚡ Gerar e Enviar Cobranças
          </button>
        </form>
      )}

      {/* SUB TAB: BAIXA BOLETOS / PIX */}
      {activeSubTab === 'baixa' && (
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-white uppercase">Retorno Bancário e Conciliação</h3>
          
          {/* File drag-drop box */}
          <div className="border-2 border-dashed border-slate-800 p-8 rounded-xl text-center bg-slate-950/40 relative hover:border-blue-500 transition-colors">
            <input type="file" accept=".ret,.ofx" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
            <p className="text-xs text-slate-300 font-bold">Arraste ou selecione o arquivo de retorno bancário (.RET ou .OFX)</p>
            <p className="text-[10px] text-slate-500 mt-2">Suporte nativo Banco Sicoob e extratos do Gateway Asaas</p>
          </div>

          {/* Integration activity logs */}
          <div className="space-y-2 bg-slate-950 p-4 rounded-lg border border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase">Histórico de Processamento Recente</h4>
            <ul className="text-xs space-y-1.5 font-mono text-slate-500">
              {importLogs.map((log, idx) => (
                <li key={idx} className="border-b border-slate-900 pb-1">
                  🟢 {log}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* SUB TAB: CONTROLE INADIMPLÊNCIA */}
      {activeSubTab === 'inadimplencia' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-white uppercase">Inadimplência Ativa & Régua de Cobrança</h3>
              <p className="text-xs text-slate-400">Automatização de avisos pré e pós-vencimento via canais integrados.</p>
            </div>
            <button onClick={() => alert("Disparando e-mails/SMS em fila de transmissão!")} className="bg-red-800 hover:bg-red-700 text-white text-xs font-bold py-2 px-4 rounded">
              📣 Disparar Régua de Cobrança
            </button>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs text-slate-400">
            <h4 className="font-bold text-white mb-2">Escopo da Régua Automática Asaas:</h4>
            <p>1. Aviso Prévio (E-mail / WhatsApp): 3 dias antes do vencimento.</p>
            <p>2. Aviso de Atraso (SMS / WhatsApp): 1 day após o vencimento.</p>
            <p>3. Cobrança Extrajudicial: 30 dias em atraso (Notificação oficial com AR digital).</p>
            <p>4. Encaminhamento Jurídico: 90 dias em atraso (Ajuizamento de execução de taxas condominiais).</p>
          </div>
        </div>
      )}

    </div>
  );
};

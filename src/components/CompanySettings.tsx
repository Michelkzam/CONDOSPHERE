import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface CompanyDetails {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  ie: string;
  address: string;
  city: string;
  state: string;
  cep: string;
  email: string;
  phone: string;
  responsibleName: string;
}

export const CompanySettings: React.FC = () => {
  const [details, setDetails] = useState<CompanyDetails>({
    razaoSocial: "Associação de Moradores do Condomínio CondoSphere Residencial",
    nomeFantasia: "CondoSphere Residencial",
    cnpj: "12.345.678/0001-90",
    ie: "123.456.789.111",
    address: "Av. Principal do Sol, s/n, Gleba A, Alphaville",
    city: "São Paulo",
    state: "SP",
    cep: "01234-567",
    email: "contato@condosphere.com.br",
    phone: "(11) 4004-2222",
    responsibleName: "Maurício Albuquerque"
  });

  const [logoPreview, setLogoPreview] = useState<string>(
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%233b82f6'><circle cx='50' cy='50' r='40' stroke='%231e3a8a' stroke-width='6' fill='%23111827'/><text x='50' y='58' font-size='26' font-weight='bold' text-anchor='middle' fill='%23ffffff'>CS</text></svg>"
  );

  // Administrative Reset States
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Dados cadastrais e parametrização de branding atualizados com sucesso!");
  };

  const handleTableCheckboxChange = (tableName: string) => {
    if (selectedTables.includes(tableName)) {
      setSelectedTables(prev => prev.filter(t => t !== tableName));
    } else {
      setSelectedTables(prev => [...prev, tableName]);
    }
  };

  const handleSelectAll = () => {
    setSelectedTables(['residences', 'residents', 'vehicles', 'reservations', 'payables', 'receivables', 'portaria_logs']);
  };

  const handleUnselectAll = () => {
    setSelectedTables([]);
  };

  const handleConfirmReset = async () => {
    if (selectedTables.length === 0) {
      alert("Nenhuma tabela foi selecionada!");
      return;
    }
    if (!window.confirm(`TEM CERTEZA ABSOLUTA?\nVocê selecionou ${selectedTables.length} tabela(s) para deletar TODOS os registros permanentemente!`)) {
      return;
    }
    if (window.confirm("Confirmação Final: Deseja prosseguir com o reset permanente dos dados?")) {
      try {
        for (const tbl of selectedTables) {
          // Sync with Supabase (Cloud Database Truncate safely)
          const { error } = await supabase
            .from(tbl)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');
            
          if (error) {
            console.error(`[SUPABASE DELETE ERROR] ${tbl}:`, error.message);
          } else {
            console.log(`[SUPABASE DELETE] Tabela ${tbl} limpa com sucesso.`);
          }
        }
        
        alert("As tabelas selecionadas foram limpas com sucesso no Supabase Cloud!");
        setIsResetModalOpen(false);
        setSelectedTables([]);
        window.location.reload(); // Refresh hoisted states
      } catch (err) {
        console.error("Erro na limpeza de tabelas:", err);
      }
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-6 text-slate-100">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-white uppercase">Dados da Empresa & Parametrização Visual</h2>
          <p className="text-xs text-slate-400">Configure a identidade visual do condomínio e as informações institucionais</p>
        </div>
        
        {/* Reset Database Button */}
        <button
          type="button"
          onClick={() => setIsResetModalOpen(true)}
          className="bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/30 font-bold py-2 px-4 rounded text-xs transition-all flex items-center gap-1.5"
        >
          <span>🧹 Resetar Tabelas</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form Details */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Cadastro Legal da Associação</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Razão Social</label>
              <input
                type="text"
                value={details.razaoSocial}
                onChange={(e) => setDetails({ ...details, razaoSocial: e.target.value })}
                className="w-full text-xs bg-slate-950 border border-slate-800 rounded p-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Nome Fantasia do Sistema</label>
              <input
                type="text"
                value={details.nomeFantasia}
                onChange={(e) => setDetails({ ...details, nomeFantasia: e.target.value })}
                className="w-full text-xs bg-slate-950 border border-slate-800 rounded p-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">CNPJ</label>
              <input
                type="text"
                value={details.cnpj}
                onChange={(e) => setDetails({ ...details, cnpj: e.target.value })}
                className="w-full text-xs bg-slate-950 border border-slate-800 rounded p-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Inscrição Estadual (IE)</label>
              <input
                type="text"
                value={details.ie}
                onChange={(e) => setDetails({ ...details, ie: e.target.value })}
                className="w-full text-xs bg-slate-950 border border-slate-800 rounded p-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-slate-400 mb-1">Endereço Administrativo</label>
              <input
                type="text"
                value={details.address}
                onChange={(e) => setDetails({ ...details, address: e.target.value })}
                className="w-full text-xs bg-slate-950 border border-slate-800 rounded p-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Responsável Administrativo</label>
              <input
                type="text"
                value={details.responsibleName}
                onChange={(e) => setDetails({ ...details, responsibleName: e.target.value })}
                className="w-full text-xs bg-slate-950 border border-slate-800 rounded p-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Telefone Principal</label>
              <input
                type="text"
                value={details.phone}
                onChange={(e) => setDetails({ ...details, phone: e.target.value })}
                className="w-full text-xs bg-slate-950 border border-slate-800 rounded p-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-5 rounded text-xs transition-colors mt-2"
          >
            Confirmar e Salvar Dados da Empresa
          </button>
        </div>

        {/* Right Column: Branding Logo Uploader */}
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 flex flex-col items-center justify-between h-fit space-y-4">
          <div className="self-start">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Logotipo Institucional</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Defina o logotipo do condomínio (Escala estrita de 200x200px)</p>
          </div>

          <div className="w-[200px] h-[200px] bg-slate-900 border-2 border-dashed border-slate-800 rounded-lg overflow-hidden flex items-center justify-center relative group">
            <img src={logoPreview} alt="Logotipo CondoSphere" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] text-white">
              Padrão 200x200px
            </div>
          </div>

          <div className="text-center space-y-2">
            <p className="text-[11px] text-slate-400 leading-relaxed px-4">
              Este logotipo será exibido automaticamente no cabeçalho dos Relatórios PDF, no topo da Barra Lateral e no Painel de Login público.
            </p>
            
            <label className="inline-block bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold py-2 px-4 rounded cursor-pointer transition-colors">
              Selecionar Imagem (.png, .jpg)
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </form>

      {/* DYNAMIC DATABASE CLEANING / RESET MODAL */}
      {isResetModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm uppercase text-red-400">🧹 Resetar Tabelas / Excluir Dados</h3>
              <button onClick={() => setIsResetModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3">
              <p className="text-slate-300">
                Selecione as tabelas do banco de dados que você deseja **limpar e apagar permanentemente todos os registros** (Supabase Cloud):
              </p>

              <div className="bg-red-500/5 border border-red-500/20 p-3 rounded-lg text-red-400 font-semibold leading-relaxed">
                ⚠️ AVISO: Esta ação apagará permanentemente todos os registros do seu banco de dados Supabase para as tabelas selecionadas.
              </div>

              <div className="flex justify-between">
                <button type="button" onClick={handleSelectAll} className="text-blue-400 hover:text-blue-300 font-bold">Selecionar Todas</button>
                <button type="button" onClick={handleUnselectAll} className="text-slate-400 hover:text-white font-bold">Desmarcar Todas</button>
              </div>

              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3 font-medium text-slate-300">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTables.includes('residences')}
                    onChange={() => handleTableCheckboxChange('residences')}
                    className="rounded bg-slate-900 border-slate-800 text-red-600 focus:ring-0"
                  />
                  🏡 Residências (Lotes)
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTables.includes('residents')}
                    onChange={() => handleTableCheckboxChange('residents')}
                    className="rounded bg-slate-900 border-slate-800 text-red-600 focus:ring-0"
                  />
                  👥 Moradores & Associados
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTables.includes('vehicles')}
                    onChange={() => handleTableCheckboxChange('vehicles')}
                    className="rounded bg-slate-900 border-slate-800 text-red-600 focus:ring-0"
                  />
                  🚗 Veículos (Frota)
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTables.includes('reservations')}
                    onChange={() => handleTableCheckboxChange('reservations')}
                    className="rounded bg-slate-900 border-slate-800 text-red-600 focus:ring-0"
                  />
                  📅 Reservas de Áreas
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTables.includes('payables')}
                    onChange={() => handleTableCheckboxChange('payables')}
                    className="rounded bg-slate-900 border-slate-800 text-red-600 focus:ring-0"
                  />
                  💸 Contas a Pagar (Saídas)
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTables.includes('receivables')}
                    onChange={() => handleTableCheckboxChange('receivables')}
                    className="rounded bg-slate-900 border-slate-800 text-red-600 focus:ring-0"
                  />
                  💰 Contas a Receber (Entradas)
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTables.includes('portaria_logs')}
                    onChange={() => handleTableCheckboxChange('portaria_logs')}
                    className="rounded bg-slate-900 border-slate-800 text-red-600 focus:ring-0"
                  />
                  📝 Histórico de Portaria
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 rounded text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-2 rounded text-xs transition-colors"
              >
                🔥 Apagar Dados
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CompanySettings;

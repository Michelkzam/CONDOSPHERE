import React, { useState } from 'react';

interface SidebarProps {
  systemName: string;
  logoUrl: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  systemName,
  logoUrl,
  activeTab,
  setActiveTab,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({
    portaria: true,
    financeiro: true,
    condominio: true,
    rh: true,
    configuracoes: false,
  });

  const toggleSubMenu = (menu: string) => {
    setOpenSubMenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

  return (
    <div
      className={`${
        isExpanded ? 'w-64' : 'w-20'
      } bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-all duration-300 relative shrink-0 min-h-screen text-slate-100 overflow-y-auto`}
    >
      <div>
        {/* Collapse/Expand Toggle Icon */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute top-4 -right-3 bg-blue-600 hover:bg-blue-500 text-white p-1 rounded-full border border-slate-700 shadow-lg z-10 transition-transform"
          aria-label="Recolher/Expandir menu"
        >
          {isExpanded ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>

        {/* LOGO SECTION - Vertical Alignment (above system name) */}
        <div className="p-6 flex flex-col items-center border-b border-slate-800 select-none">
          <div
            className={`transition-all duration-300 overflow-hidden flex items-center justify-center rounded-lg bg-slate-800 ${
              isExpanded ? 'w-[140px] h-[140px]' : 'w-10 h-10'
            }`}
          >
            <img
              src={logoUrl}
              alt="Logo do Sistema"
              className="w-full h-full object-cover transition-all"
            />
          </div>
          {isExpanded && (
            <div className="text-center mt-3">
              <h2 className="text-sm font-extrabold text-white tracking-wider truncate max-w-[200px] uppercase">
                {systemName}
              </h2>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">ERP & Governança</span>
            </div>
          )}
        </div>

        {/* NAVIGATION MENUS */}
        <nav className="mt-4 px-3 space-y-2 pb-6">
          {/* Dashboard */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z"
              />
            </svg>
            {isExpanded && <span>Painel Principal</span>}
          </button>

          {/* Portaria */}
          <div>
            <button
              onClick={() => toggleSubMenu('portaria')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                {isExpanded && <span>Portaria</span>}
              </div>
              {isExpanded && (
                <svg
                  className={`w-3.5 h-3.5 transition-transform ${openSubMenus.portaria ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
            {openSubMenus.portaria && isExpanded && (
              <div className="pl-8 pr-2 py-1 space-y-1 bg-slate-950/20 rounded-md mt-1">
                <button
                  onClick={() => setActiveTab('portaria')}
                  className={`w-full text-left py-1 text-xs rounded hover:text-white block transition-colors ${
                    activeTab === 'portaria' ? 'text-blue-400 font-extrabold' : 'text-slate-400'
                  }`}
                >
                  Log de Acesso
                </button>
                <button
                  onClick={() => setActiveTab('portaria_entregas')}
                  className={`w-full text-left py-1 text-xs rounded hover:text-white block transition-colors ${
                    activeTab === 'portaria_entregas' ? 'text-blue-400 font-extrabold' : 'text-slate-400'
                  }`}
                >
                  📦 Encomendas
                </button>
              </div>
            )}
          </div>

          {/* Financeiro */}
          <div>
            <button
              onClick={() => toggleSubMenu('financeiro')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {isExpanded && <span>Financeiro</span>}
              </div>
              {isExpanded && (
                <svg
                  className={`w-3.5 h-3.5 transition-transform ${openSubMenus.financeiro ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
            {openSubMenus.financeiro && isExpanded && (
              <div className="pl-8 pr-2 py-1 space-y-1 bg-slate-950/20 rounded-md mt-1">
                <button
                  onClick={() => setActiveTab('receivables')}
                  className={`w-full text-left py-1 text-xs rounded hover:text-white block transition-colors ${
                    activeTab === 'receivables' ? 'text-blue-400 font-extrabold' : 'text-slate-400'
                  }`}
                >
                  Contas a Receber
                </button>
                <button
                  onClick={() => setActiveTab('payables')}
                  className={`w-full text-left py-1 text-xs rounded hover:text-white block transition-colors ${
                    activeTab === 'payables' ? 'text-blue-400 font-extrabold' : 'text-slate-400'
                  }`}
                >
                  Contas a Pagar
                </button>
                <button
                  onClick={() => setActiveTab('conciliacao')}
                  className={`w-full text-left py-1 text-xs rounded hover:text-white block transition-colors ${
                    activeTab === 'conciliacao' ? 'text-blue-400 font-extrabold' : 'text-slate-400'
                  }`}
                >
                  Conciliação & Controle
                </button>
                <button
                  onClick={() => setActiveTab('conciliacao_bancaria')}
                  className={`w-full text-left py-1 text-xs rounded hover:text-white block transition-colors ${
                    activeTab === 'conciliacao_bancaria' ? 'text-blue-400 font-extrabold' : 'text-slate-400'
                  }`}
                >
                  🏦 Conciliação Bancária
                </button>
                <button
                  onClick={() => setActiveTab('cancelamentos')}
                  className={`w-full text-left py-1 text-xs rounded hover:text-white block transition-colors ${
                    activeTab === 'cancelamentos' ? 'text-blue-400 font-extrabold' : 'text-slate-400'
                  }`}
                >
                  🔄 Cancelamentos/Estornos
                </button>
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`w-full text-left py-1 text-xs rounded hover:text-white block transition-colors ${
                    activeTab === 'reports' ? 'text-blue-400 font-extrabold' : 'text-slate-400'
                  }`}
                >
                  Relatórios & Gestão
                </button>
              </div>
            )}
          </div>

          {/* Condomínio Submenu */}
          <div>
            <button
              onClick={() => toggleSubMenu('condominio')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                {isExpanded && <span>Condomínio</span>}
              </div>
              {isExpanded && (
                <svg
                  className={`w-3.5 h-3.5 transition-transform ${openSubMenus.condominio ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
            {openSubMenus.condominio && isExpanded && (
              <div className="pl-8 pr-2 py-1 space-y-1 bg-slate-950/20 rounded-md mt-1">
                <button
                  onClick={() => setActiveTab('residencias')}
                  className={`w-full text-left py-1 text-xs rounded hover:text-white block transition-colors ${
                    activeTab === 'residencias' ? 'text-blue-400 font-extrabold' : 'text-slate-400'
                  }`}
                >
                  Residências
                </button>
                <button
                  onClick={() => setActiveTab('moradores')}
                  className={`w-full text-left py-1 text-xs rounded hover:text-white block transition-colors ${
                    activeTab === 'moradores' ? 'text-blue-400 font-extrabold' : 'text-slate-400'
                  }`}
                >
                  Moradores
                </button>
                <button
                  onClick={() => setActiveTab('veiculos')}
                  className={`w-full text-left py-1 text-xs rounded hover:text-white block transition-colors ${
                    activeTab === 'veiculos' ? 'text-blue-400 font-extrabold' : 'text-slate-400'
                  }`}
                >
                  Veículos
                </button>
                <button
                  onClick={() => setActiveTab('areas_comuns')}
                  className={`w-full text-left py-1 text-xs rounded hover:text-white block transition-colors ${
                    activeTab === 'areas_comuns' ? 'text-blue-400 font-extrabold' : 'text-slate-400'
                  }`}
                >
                  Áreas Comuns
                </button>
                <button
                  onClick={() => setActiveTab('reservas')}
                  className={`w-full text-left py-1 text-xs rounded hover:text-white block transition-colors ${
                    activeTab === 'reservas' ? 'text-blue-400 font-extrabold' : 'text-slate-400'
                  }`}
                >
                  Reservas
                </button>
                <button
                  onClick={() => setActiveTab('assemblies')}
                  className={`w-full text-left py-1 text-xs rounded hover:text-white block transition-colors ${
                    activeTab === 'assemblies' ? 'text-blue-400 font-extrabold' : 'text-slate-400'
                  }`}
                >
                  Assembleias Virtuais
                </button>
                <button
                  onClick={() => setActiveTab('ouvidoria')}
                  className={`w-full text-left py-1 text-xs rounded hover:text-white block transition-colors ${
                    activeTab === 'ouvidoria' ? 'text-blue-400 font-extrabold' : 'text-slate-400'
                  }`}
                >
                  📢 Ouvidoria
                </button>
              </div>
            )}
          </div>

          {/* Notificações */}
          <button
            onClick={() => setActiveTab('notificacoes')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === 'notificacoes'
                ? 'bg-blue-600 text-white font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {isExpanded && <span>Notificações</span>}
          </button>

          {/* RH e Pessoal */}
          <div>
            <button
              onClick={() => toggleSubMenu('rh')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {isExpanded && <span>RH & DP</span>}
              </div>
              {isExpanded && (
                <svg
                  className={`w-3.5 h-3.5 transition-transform ${openSubMenus.rh ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
            {openSubMenus.rh && isExpanded && (
              <div className="pl-8 pr-2 py-1 space-y-1 bg-slate-950/20 rounded-md mt-1">
                <button
                  onClick={() => setActiveTab('payroll')}
                  className={`w-full text-left py-1 text-xs rounded hover:text-white block transition-colors ${
                    activeTab === 'payroll' ? 'text-blue-400 font-extrabold' : 'text-slate-400'
                  }`}
                >
                  Folha de Pagamento
                </button>
                <button
                  onClick={() => setActiveTab('ponto_beneficios')}
                  className={`w-full text-left py-1 text-xs rounded hover:text-white block transition-colors ${
                    activeTab === 'ponto_beneficios' ? 'text-blue-400 font-extrabold' : 'text-slate-400'
                  }`}
                >
                  Ponto & Benefícios
                </button>
                <button
                  onClick={() => setActiveTab('rh_estrategico')}
                  className={`w-full text-left py-1 text-xs rounded hover:text-white block transition-colors ${
                    activeTab === 'rh_estrategico' ? 'text-blue-400 font-extrabold' : 'text-slate-400'
                  }`}
                >
                  RH Estratégico
                </button>
                <button
                  onClick={() => setActiveTab('portal_colaborador')}
                  className={`w-full text-left py-1 text-xs rounded hover:text-white block transition-colors ${
                    activeTab === 'portal_colaborador' ? 'text-blue-400 font-extrabold' : 'text-slate-400'
                  }`}
                >
                  Portal do Colaborador
                </button>
                <button
                  onClick={() => setActiveTab('people_analytics')}
                  className={`w-full text-left py-1 text-xs rounded hover:text-white block transition-colors ${
                    activeTab === 'people_analytics' ? 'text-blue-400 font-extrabold' : 'text-slate-400'
                  }`}
                >
                  People Analytics
                </button>
              </div>
            )}
          </div>

          {/* Configurações Master Submenu */}
          <div>
            <button
              onClick={() => toggleSubMenu('configuracoes')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {isExpanded && <span>Configurações</span>}
              </div>
              {isExpanded && (
                <svg
                  className={`w-3.5 h-3.5 transition-transform ${openSubMenus.configuracoes ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
            {openSubMenus.configuracoes && isExpanded && (
              <div className="pl-8 pr-2 py-1 space-y-1 bg-slate-950/20 rounded-md mt-1">
                <button
                  onClick={() => setActiveTab('config_empresa')}
                  className={`w-full text-left py-1 text-xs rounded hover:text-white block transition-colors ${
                    activeTab === 'config_empresa' ? 'text-blue-400 font-extrabold' : 'text-slate-400'
                  }`}
                >
                  Dados da Empresa
                </button>
                <button
                  onClick={() => setActiveTab('config_perfis')}
                  className={`w-full text-left py-1 text-xs rounded hover:text-white block transition-colors ${
                    activeTab === 'config_perfis' ? 'text-blue-400 font-extrabold' : 'text-slate-400'
                  }`}
                >
                  Perfis de Acesso (RBAC)
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
};
export default Sidebar;

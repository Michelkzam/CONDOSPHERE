import React, { useState } from 'react';

interface ModulePermission {
  moduleName: string;
  ver: boolean;
  criar: boolean;
  editar: boolean;
  excluir: boolean;
}

interface AccessProfile {
  id: number;
  name: string;
  isActive: boolean;
  permissions: Record<string, ModulePermission[]>; // Grouped by category!
}

const DEFAULT_CATEGORIES: Record<string, string[]> = {
  "Dashboard": ["Dashboard Principal"],
  "Condomínio": ["Residências", "Moradores", "Veículos (Frota)", "Áreas Comuns", "Reservas", "Assembleias Virtuais"],
  "Financeiro": [
    "Receber: Lançamentos",
    "Receber: Acordos",
    "Pagar: Despesas CLT",
    "Pagar: Aprovação",
    "Conciliação (CNAB240)",
    "Plano de Contas",
    "Fundo de Reserva",
    "Previsão Orçamentária",
    "Balancete / DRE"
  ],
  "Portaria": ["Log de Acessos"],
  "RH & Pessoal": [
    "Folha de Pagamento",
    "Controle de Ponto",
    "Gestão de Benefícios",
    "RH Estratégico",
    "Portal do Colaborador",
    "People Analytics",
    "Prestadores de Serviço"
  ],
  "Comunicação": ["Avisos & Notificações"],
  "Configurações": ["Dados da Empresa", "Usuários do Sistema", "Perfis de Acesso (RBAC)"]
};

export const AccessProfiles: React.FC = () => {
  const [profiles, setProfiles] = useState<AccessProfile[]>([
    {
      id: 1,
      name: "Administrador",
      isActive: true,
      permissions: Object.keys(DEFAULT_CATEGORIES).reduce((acc, cat) => {
        acc[cat] = DEFAULT_CATEGORIES[cat].map(sub => ({ moduleName: sub, ver: true, criar: true, editar: true, excluir: true }));
        return acc;
      }, {} as Record<string, ModulePermission[]>)
    },
    {
      id: 2,
      name: "Colaborador",
      isActive: true,
      permissions: Object.keys(DEFAULT_CATEGORIES).reduce((acc, cat) => {
        const isRestricted = cat === 'Financeiro' || cat === 'Configurações';
        acc[cat] = DEFAULT_CATEGORIES[cat].map(sub => ({
          moduleName: sub,
          ver: !isRestricted,
          criar: !isRestricted,
          editar: !isRestricted,
          excluir: false
        }));
        return acc;
      }, {} as Record<string, ModulePermission[]>)
    },
    {
      id: 3,
      name: "Morador",
      isActive: true,
      permissions: Object.keys(DEFAULT_CATEGORIES).reduce((acc, cat) => {
        const isAllowed = cat === 'Dashboard' || cat === 'Condomínio' || cat === 'RH & Pessoal' || cat === 'Comunicação';
        acc[cat] = DEFAULT_CATEGORIES[cat].map(sub => ({
          moduleName: sub,
          ver: isAllowed,
          criar: false,
          editar: false,
          excluir: false
        }));
        return acc;
      }, {} as Record<string, ModulePermission[]>)
    },
    {
      id: 4,
      name: "Portaria",
      isActive: true,
      permissions: Object.keys(DEFAULT_CATEGORIES).reduce((acc, cat) => {
        const isAllowed = cat === 'Dashboard' || cat === 'Portaria' || cat === 'Condomínio';
        acc[cat] = DEFAULT_CATEGORIES[cat].map(sub => ({
          moduleName: sub,
          ver: isAllowed,
          criar: cat === 'Portaria',
          editar: false,
          excluir: false
        }));
        return acc;
      }, {} as Record<string, ModulePermission[]>)
    }
  ]);

  // Keep track of which accordion categories are expanded per profile
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleAccordion = (profileId: number, category: string) => {
    const key = `${profileId}-${category}`;
    setExpanded(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileActive, setNewProfileActive] = useState(true);
  const [newPermissions, setNewPermissions] = useState<Record<string, ModulePermission[]>>(
    Object.keys(DEFAULT_CATEGORIES).reduce((acc, cat) => {
      acc[cat] = DEFAULT_CATEGORIES[cat].map(sub => ({ moduleName: sub, ver: true, criar: false, editar: false, excluir: false }));
      return acc;
    }, {} as Record<string, ModulePermission[]>)
  );

  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;

    const newProfile: AccessProfile = {
      id: profiles.length + 1,
      name: newProfileName,
      isActive: newProfileActive,
      permissions: newPermissions
    };

    setProfiles((prev) => [...prev, newProfile]);
    setNewProfileName("");
    setNewProfileActive(true);
    setNewPermissions(
      Object.keys(DEFAULT_CATEGORIES).reduce((acc, cat) => {
        acc[cat] = DEFAULT_CATEGORIES[cat].map(sub => ({ moduleName: sub, ver: true, criar: false, editar: false, excluir: false }));
        return acc;
      }, {} as Record<string, ModulePermission[]>)
    );
    setIsModalOpen(false);
    alert(`Perfil de acesso "${newProfileName}" criado com sucesso!`);
  };

  const handlePermissionChange = (category: string, subIndex: number, field: 'ver' | 'criar' | 'editar' | 'excluir', checked: boolean) => {
    setNewPermissions(prev => {
      const list = [...prev[category]];
      list[subIndex] = {
        ...list[subIndex],
        [field]: checked
      };
      return {
        ...prev,
        [category]: list
      };
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-6 text-slate-100 font-sans select-none">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-bold text-white uppercase tracking-tight">Perfis de Acesso (RBAC)</h2>
          <p className="text-xs text-slate-400 font-sans">Mapeamento de permissões estruturado em formato de acordeão semelhante ao menu lateral</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded text-xs transition-colors flex items-center gap-1"
        >
          🔑 Criar Perfil Customizado
        </button>
      </div>

      {/* Grid of Profiles - Collapsible accordions */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {profiles.map((p) => (
          <div key={p.id} className="bg-slate-950/70 border border-slate-800 p-5 rounded-xl space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base">{p.name}</h3>
              
              {/* Profile Active Switch */}
              <div className="flex items-center gap-2">
                <label className="relative inline-block w-10 h-5">
                  <input type="checkbox" checked={p.isActive} disabled className="opacity-0 w-0 h-0" />
                  <span className={`absolute inset-0 cursor-not-allowed rounded-full transition-all duration-300 before:absolute before:content-[''] before:h-3.5 before:w-3.5 before:left-0.5 before:bottom-0.5 before:bg-white before:rounded-full before:transition-all ${
                    p.isActive ? 'bg-emerald-500 before:translate-x-5' : 'bg-slate-700'
                  }`} />
                </label>
                <span className="text-[11px] font-bold text-slate-400">Perfil ativo</span>
              </div>
            </div>

            <p className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">Permissões por Módulo (Clique para expandir)</p>

            {/* Accordion List */}
            <div className="space-y-2">
              {Object.keys(DEFAULT_CATEGORIES).map((cat) => {
                const isExpanded = expanded[`${p.id}-${cat}`];
                const list = p.permissions[cat] || [];

                return (
                  <div key={cat} className="space-y-1">
                    <button
                      onClick={() => toggleAccordion(p.id, cat)}
                      className="w-full flex justify-between items-center bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-xs font-bold text-slate-200 hover:bg-slate-800/60 transition-colors"
                    >
                      <span>{cat}</span>
                      <svg className={`w-3.5 h-3.5 transition-transform text-slate-400 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isExpanded && (
                      <div className="p-3 bg-slate-900/20 border-l-2 border-blue-600 rounded-b-lg overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="text-slate-500 text-[9px] uppercase border-b border-slate-800">
                              <th className="py-2">Submenu / Aba</th>
                              <th className="py-2 text-center">Ver</th>
                              <th className="py-2 text-center">Criar</th>
                              <th className="py-2 text-center">Editar</th>
                              <th className="py-2 text-center">Excluir</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-900/60">
                            {list.map((perm, subIdx) => (
                              <tr key={subIdx}>
                                <td className="py-2 font-medium text-slate-400">{perm.moduleName}</td>
                                <td className="py-2 text-center">
                                  <input type="checkbox" checked={perm.ver} disabled className="rounded bg-slate-950 border-slate-800 text-blue-600 cursor-not-allowed" />
                                </td>
                                <td className="py-2 text-center">
                                  <input type="checkbox" checked={perm.criar} disabled className="rounded bg-slate-950 border-slate-800 text-blue-600 cursor-not-allowed" />
                                </td>
                                <td className="py-2 text-center">
                                  <input type="checkbox" checked={perm.editar} disabled className="rounded bg-slate-950 border-slate-800 text-blue-600 cursor-not-allowed" />
                                </td>
                                <td className="py-2 text-center">
                                  <input type="checkbox" checked={perm.excluir} disabled className="rounded bg-slate-950 border-slate-800 text-blue-600 cursor-not-allowed" />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* CREATE PROFILE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form
            onSubmit={handleCreateProfile}
            className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg w-full space-y-4 shadow-2xl text-slate-100 text-xs"
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm uppercase">🔑 Novo Perfil de Acesso Customizado</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Nome do Perfil</label>
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="Ex: Auditor, Supervisor Portaria, Síndico"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                  required
                />
              </div>

              {/* Profile active toggle */}
              <div className="flex items-center gap-2 select-none py-1">
                <label className="relative inline-block w-10 h-5 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={newProfileActive} 
                    onChange={(e) => setNewProfileActive(e.target.checked)}
                    className="opacity-0 w-0 h-0" 
                  />
                  <span className={`absolute inset-0 rounded-full transition-all duration-300 before:absolute before:content-[''] before:h-3.5 before:w-3.5 before:left-0.5 before:bottom-0.5 before:bg-white before:rounded-full before:transition-all ${
                    newProfileActive ? 'bg-emerald-500 before:translate-x-5' : 'bg-slate-700'
                  }`} />
                </label>
                <span className="font-bold text-slate-300">Perfil ativo</span>
              </div>

              {/* Accordion selector table in modal */}
              <div className="space-y-2">
                <p className="font-bold text-slate-300 uppercase text-[10px] tracking-wider">Permissões por Módulo (Clique para expandir)</p>
                
                {Object.keys(DEFAULT_CATEGORIES).map((cat) => {
                  const isExpanded = expanded[`new-${cat}`];
                  const list = newPermissions[cat] || [];

                  return (
                    <div key={cat} className="space-y-1">
                      <button
                        type="button"
                        onClick={() => toggleAccordion(999, cat)} // Use 999 as ID for new profile
                        className="w-full flex justify-between items-center bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-xs font-bold text-slate-300 hover:bg-slate-900/60 transition-colors"
                      >
                        <span>{cat}</span>
                        <svg className={`w-3.5 h-3.5 transition-transform text-slate-400 ${expanded[`999-${cat}`] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {expanded[`999-${cat}`] && (
                        <div className="p-3 bg-slate-950/40 border-l-2 border-blue-600 rounded-b-lg overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="text-slate-500 text-[9px] uppercase border-b border-slate-800">
                                <th className="p-2">Submenu / Aba</th>
                                <th className="p-2 text-center">Ver</th>
                                <th className="p-2 text-center">Criar</th>
                                <th className="p-2 text-center">Editar</th>
                                <th className="p-2 text-center">Excluir</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-850">
                              {list.map((perm, subIdx) => (
                                <tr key={subIdx} className="hover:bg-slate-800/10">
                                  <td className="p-2 font-medium text-slate-400">{perm.moduleName}</td>
                                  <td className="p-2 text-center">
                                    <input
                                      type="checkbox"
                                      checked={perm.ver}
                                      onChange={(e) => handlePermissionChange(cat, subIdx, 'ver', e.target.checked)}
                                      className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0 cursor-pointer"
                                    />
                                  </td>
                                  <td className="p-2 text-center">
                                    <input
                                      type="checkbox"
                                      checked={perm.criar}
                                      onChange={(e) => handlePermissionChange(cat, subIdx, 'criar', e.target.checked)}
                                      className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0 cursor-pointer"
                                    />
                                  </td>
                                  <td className="p-2 text-center">
                                    <input
                                      type="checkbox"
                                      checked={perm.editar}
                                      onChange={(e) => handlePermissionChange(cat, subIdx, 'editar', e.target.checked)}
                                      className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0 cursor-pointer"
                                    />
                                  </td>
                                  <td className="p-2 text-center">
                                    <input
                                      type="checkbox"
                                      checked={perm.excluir}
                                      onChange={(e) => handlePermissionChange(cat, subIdx, 'excluir', e.target.checked)}
                                      className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0 cursor-pointer"
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 rounded text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded text-xs transition-colors"
              >
                Salvar Perfil
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
export default AccessProfiles;

import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Residences } from './components/Residences';
import { Residents } from './components/Residents';
import { Vehicles } from './components/Vehicles';
import { CommonAreas } from './components/CommonAreas';
import { Reservations } from './components/Reservations';
import { AccountsReceivable } from './components/AccountsReceivable';
import { AccountsPayable } from './components/AccountsPayable';
import { ConciliationControl } from './components/ConciliationControl';
import { FinancialReports } from './components/FinancialReports';
import { Payroll } from './components/Payroll';
import { PortariaAccessLog } from './components/PortariaAccessLog';
import { PortariaDeliveries } from './components/PortariaDeliveries';
import { Ouvidoria } from './components/Ouvidoria';
import { NotificationsConfig } from './components/NotificationsConfig';
import { BankReconciliation } from './components/BankReconciliation';
import { CancellationRefund } from './components/CancellationRefund';
import { AccessProfiles } from './components/AccessProfiles';
import { CompanySettings } from './components/CompanySettings';
import { Assemblies } from './components/Assemblies';
import { PontoAndBenefits } from './components/PontoAndBenefits';
import { StrategicHR } from './components/StrategicHR';
import { EmployeePortal } from './components/EmployeePortal';
import { PeopleAnalytics } from './components/PeopleAnalytics';
import { Login } from './components/Login';
import { supabase } from './lib/supabaseClient'; // Import safe supabase client

interface AuthenticatedUser {
  username: string;
  role: string;
  name: string;
  job: string;
  avatar: string;
}

export const App: React.FC = () => {
  const [systemName, setSystemName] = useState("CondoSphere");
  const [logoUrl, setLogoUrl] = useState("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%231e3a8a'><rect width='100' height='100' rx='15'/><text x='50' y='55' fill='white' font-size='26' font-weight='bold' text-anchor='middle'>CS</text></svg>");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const syncDoneRef = useRef(false);

  // --- HOISTED SHARED STATES (INITIAL FALLBACKS) ---
  const [residences, setResidences] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('condosphere_residences');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [
      { id: 1, identifier: "Quadra A - Lote 05", owner: "Carlos Henrique Silva", address: "Av. das Palmeiras, 102", profileName: "Perfil Lote Padrão", baseValue: 300.00, status: "Ativo" },
      { id: 2, identifier: "Quadra A - Lote 12", owner: "Mariana Souza Oliveira", address: "Av. das Palmeiras, 220", profileName: "Perfil Lote Luxo", baseValue: 500.00, status: "Ativo" },
      { id: 3, identifier: "Quadra D - Lote 01", owner: "Associação Comercial", address: "Av. Principal, 500", profileName: "Perfil Comercial", baseValue: 750.00, status: "Ativo" },
    ];
  });

  const [residents, setResidents] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('condosphere_residents');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [
      { id: 1, name: "Carlos Henrique Silva", cpf: "123.456.789-01", contact: "(11) 98765-4321", role: "Proprietário", isAssociated: true, isResident: true, residenceId: 1 },
      { id: 2, name: "Mariana Souza Oliveira", cpf: "987.654.321-02", contact: "(11) 97654-3210", role: "Proprietário", isAssociated: true, isResident: true, residenceId: 2 },
      { id: 3, name: "Roberto de Alencar", cpf: "456.789.123-03", contact: "(11) 96543-2109", role: "Inquilino", isAssociated: false, isResident: true, residenceId: null },
    ];
  });

  const [receivables, setReceivables] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('condosphere_receivables');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [
      { id: 101, identifier: "Quadra B - Lote 02", owner: "Roberto de Alencar", dueDate: "2026-05-10", delayDays: 32, baseValue: 300.00, extraCharges: 0, status: "Vencido" },
      { id: 102, identifier: "Quadra E - Lote 08", owner: "Fernando Mendes", dueDate: "2026-04-10", delayDays: 62, baseValue: 300.00, extraCharges: 18.40, status: "Vencido" },
      { id: 103, identifier: "Quadra C - Lote 18", owner: "Isabela Pereira Costa", dueDate: "2026-05-20", delayDays: 22, baseValue: 500.00, extraCharges: 13.80, status: "Vencido" },
      { id: 104, identifier: "Quadra A - Lote 05", owner: "Carlos Henrique Silva", dueDate: "2026-06-10", delayDays: 0, baseValue: 300.00, extraCharges: 0, status: "Pago" },
      { id: 105, identifier: "Quadra A - Lote 12", owner: "Mariana Souza Oliveira", dueDate: "2026-06-10", delayDays: 0, baseValue: 500.00, extraCharges: 0, status: "Pago" },
    ];
  });

  // --- PERSISTENCE TO LOCAL STORAGE ---
  useEffect(() => {
    localStorage.setItem('condosphere_residences', JSON.stringify(residences));
  }, [residences]);

  useEffect(() => {
    localStorage.setItem('condosphere_residents', JSON.stringify(residents));
  }, [residents]);

  useEffect(() => {
    localStorage.setItem('condosphere_receivables', JSON.stringify(receivables));
  }, [receivables]);

  // --- SUPABASE LIVE DB SYNC: FETCH ON MOUNT (FULL OPERATION) ---
  useEffect(() => {
    async function fetchFromSupabase() {
      if (!supabase) return;
      try {
        // 1. Fetch residences
        const { data: resData, error: resError } = await supabase
          .from('residences')
          .select('*');
        if (!resError && resData && resData.length > 0) {
          const mappedRes = resData.map((r: any) => ({
            id: r.id,
            identifier: r.identifier,
            owner: r.owner,
            address: r.address,
            profileName: r.profile_name,
            baseValue: Number(r.base_value),
            status: r.status
          }));
          setResidences(mappedRes);
        }

        // 2. Fetch residents
        const { data: morData, error: morError } = await supabase
          .from('residents')
          .select('*');
        if (!morError && morData && morData.length > 0) {
          const mappedMor = morData.map((m: any) => ({
            id: m.id,
            name: m.name,
            cpf: m.cpf,
            contact: m.contact,
            role: m.role,
            isAssociated: m.is_associated,
            isResident: m.is_resident,
            residenceId: m.residence_id
          }));
          setResidents(mappedMor);
        }

        // 3. Fetch receivables
        const { data: recData, error: recError } = await supabase
          .from('receivables')
          .select('*');
        if (!recError && recData && recData.length > 0) {
          const mappedRecs = recData.map((rc: any) => ({
            id: rc.id,
            identifier: rc.identifier || "Mensalidade",
            owner: rc.owner_name,
            dueDate: rc.due_date,
            delayDays: rc.delay_days || 0,
            baseValue: Number(rc.base_value),
            extraCharges: Number(rc.extra_fees),
            agreedDiscounts: Number(rc.agreed_discounts),
            chargeType: rc.charge_type,
            paymentMethod: rc.payment_method,
            paymentDate: rc.payment_date,
            notes: rc.notes,
            referenceMonth: rc.reference_month,
            isWriteOff: rc.is_write_off || false,
            writeOffDate: rc.write_off_date,
            writeOffReason: rc.write_off_reason,
            status: ['Pendente', 'Pago', 'Vencido', 'Acordo'].includes(rc.status) ? rc.status : 'Pendente'
          }));
          setReceivables(mappedRecs);
        }
      } catch (e) {
        console.warn("[SUPABASE FETCH] Cloud sync temporarily offline, using high-fidelity local cache fallbacks.", e);
      }
      syncDoneRef.current = true;
    }
    fetchFromSupabase();
  }, []);

  // --- CENTRAL AUTOMATIC SYNCHRONIZER (RESIDENCES & RESIDENTS -> RECEIVABLES) ---
  useEffect(() => {
    if (syncDoneRef.current) return; // skip if Supabase already loaded
    let currentRecs = [...receivables];
    let hasChanges = false;
    const now = new Date();
    const configDueDay = 10;
    const nextDueDate = new Date(now.getFullYear(), now.getMonth() + (now.getDate() >= configDueDay ? 1 : 0), configDueDay);
    const dueDateStr = nextDueDate.toISOString().split('T')[0];
    const refMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    residences.forEach((res) => {
      if (!res.owner || res.owner === "Sem Proprietário" || res.owner === "Nenhum") return;
      const exists = currentRecs.some(r => r.identifier === res.identifier && r.owner === res.owner);
      if (!exists) {
        const newId = 100 + Math.floor(Math.random() * 9000);
        currentRecs.push({
          id: newId,
          identifier: res.identifier,
          owner: res.owner,
          dueDate: dueDateStr,
          delayDays: 0,
          baseValue: res.baseValue || 300.00,
          extraCharges: 0,
          chargeType: 'Ordinária',
          referenceMonth: refMonth,
          status: "Pendente"
        });
        hasChanges = true;

        supabase.from('receivables').insert([{
          identifier: res.identifier,
          owner_name: res.owner,
          due_date: dueDateStr,
          base_value: res.baseValue || 300.00,
          extra_fees: 0.00,
          agreed_discounts: 0.00,
          charge_type: 'Ordinária',
          reference_month: refMonth,
          status: 'Pendente'
        }]).then(({ error }) => {
          if (error) console.error("[SUPABASE ERROR] Create sync receivable failed:", error.message);
        });
      }
    });

    if (hasChanges) {
      setReceivables(currentRecs);
    }
  }, [residences]);

  useEffect(() => {
    // Check session on load
    const cachedUser = localStorage.getItem('currentUser');
    if (cachedUser) {
      try {
        setCurrentUser(JSON.parse(cachedUser));
      } catch (e) {
        localStorage.removeItem('currentUser');
      }
    }
    setIsLoading(false);
  }, []);

  const handleLoginSuccess = (user: AuthenticatedUser) => {
    localStorage.setItem('currentUser', JSON.stringify(user));
    setCurrentUser(user);
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
  };

  const renderContent = () => {
    if (!currentUser) return null;

    // RBAC: Dynamic routing restrictions based on logged-in user role
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'residencias':
        return <Residences residences={residences} setResidences={setResidences} setReceivables={setReceivables} />;
      case 'moradores':
        return <Residents residents={residents} setResidents={setResidents} residences={residences} setReceivables={setReceivables} />;
      case 'veiculos':
        return <Vehicles />;
      case 'areas_comuns':
        return <CommonAreas />;
      case 'reservas':
        return <Reservations />;
      case 'receivables':
        if (currentUser.role === 'Morador' || currentUser.role === 'Colaborador') return <div className="p-6 text-slate-500">🔒 Acesso restrito ao perfil de Administrador</div>;
        return <AccountsReceivable receivables={receivables} setReceivables={setReceivables} residents={residents} residences={residences} />;
      case 'payables':
        if (currentUser.role === 'Morador' || currentUser.role === 'Colaborador') return <div className="p-6 text-slate-500">🔒 Acesso restrito ao perfil de Administrador</div>;
        return <AccountsPayable />;
      case 'conciliacao':
        if (currentUser.role === 'Morador' || currentUser.role === 'Colaborador') return <div className="p-6 text-slate-500">🔒 Acesso restrito ao perfil de Administrador</div>;
        return <ConciliationControl />;
      case 'reports':
        if (currentUser.role === 'Morador' || currentUser.role === 'Colaborador') return <div className="p-6 text-slate-500">🔒 Acesso restrito ao perfil de Administrador</div>;
        return <FinancialReports />;
      case 'payroll':
        if (currentUser.role === 'Morador') return <div className="p-6 text-slate-500">🔒 Acesso restrito ao administrative</div>;
        return <Payroll />;
      case 'ponto_beneficios':
        if (currentUser.role === 'Morador') return <div className="p-6 text-slate-500">🔒 Acesso restrito ao administrative</div>;
        return <PontoAndBenefits />;
      case 'rh_estrategico':
        if (currentUser.role === 'Morador') return <div className="p-6 text-slate-500">🔒 Acesso restrito ao administrative</div>;
        return <StrategicHR />;
      case 'portal_colaborador':
        return <EmployeePortal />;
      case 'people_analytics':
        if (currentUser.role === 'Morador') return <div className="p-6 text-slate-500">🔒 Acesso restrito ao administrative</div>;
        return <PeopleAnalytics />;
      case 'portaria':
        if (currentUser.role === 'Morador') return <div className="p-6 text-slate-500">🔒 Acesso restrito ao administrative e portaria</div>;
        return <PortariaAccessLog />;
      case 'portaria_entregas':
        if (currentUser.role === 'Morador') return <div className="p-6 text-slate-500">🔒 Acesso restrito ao administrative e portaria</div>;
        return <PortariaDeliveries />;
      case 'ouvidoria':
        return <Ouvidoria />;
      case 'notificacoes':
        if (currentUser.role !== 'Administrador') return <div className="p-6 text-slate-500">🔒 Acesso restrito ao perfil de Administrador</div>;
        return <NotificationsConfig />;
      case 'conciliacao_bancaria':
        if (currentUser.role === 'Morador' || currentUser.role === 'Colaborador') return <div className="p-6 text-slate-500">🔒 Acesso restrito ao perfil de Administrador</div>;
        return <BankReconciliation receivables={receivables} />;
      case 'cancelamentos':
        if (currentUser.role === 'Morador') return <div className="p-6 text-slate-500">🔒 Acesso restrito ao perfil de Administrador</div>;
        return <CancellationRefund receivables={receivables} />;
      case 'config_perfis':
        if (currentUser.role !== 'Administrador') return <div className="p-6 text-slate-500">🔒 Acesso restrito ao perfil de Administrador</div>;
        return <AccessProfiles />;
      case 'config_empresa':
        if (currentUser.role !== 'Administrador') return <div className="p-6 text-slate-500">🔒 Acesso restrito ao perfil de Administrador</div>;
        return (
          <CompanySettings 
            onSave={(name, logo) => {
              setSystemName(name);
              if (logo) setLogoUrl(logo);
            }} 
          />
        );
      case 'assemblies':
        return <Assemblies />;
      default:
        return <Dashboard />;
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Carregando CondoSphere...</div>;
  }

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex bg-slate-950 text-slate-100 min-h-screen font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar 
        systemName={systemName} 
        logoUrl={logoUrl} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />

      {/* Main Panel Content Area */}
      <main className="flex-1 overflow-y-auto p-8 space-y-6">
        {/* Top Header */}
        <header className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4 select-none">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white uppercase">{systemName} ERP</h1>
            <p className="text-xs text-slate-400">Plataforma Avançada de Governança Administrativa</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20 font-semibold uppercase tracking-wide">
              {currentUser.role}
            </span>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-xs font-mono">
                {currentUser.avatar}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold text-white">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 font-medium">{currentUser.job}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 border border-red-500/20 px-2.5 py-1 rounded text-[10px] font-bold transition-all ml-1 uppercase"
              >
                Sair ✕
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Tab Render */}
        <div className="animate-fade-in">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;

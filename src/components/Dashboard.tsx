import React from 'react';

interface DashboardProps {
  userRole: 'Administrador' | 'Portaria' | 'Zelador';
  unidadesCount: number;
  unidadesTotal: number;
  inadimplenciaValue: number;
  acessosCount: number;
  reservasCount: number;
}

export const Dashboard: React.FC<DashboardProps> = ({
  userRole,
  unidadesCount,
  unidadesTotal,
  inadimplenciaValue,
  acessosCount,
  reservasCount
}) => {
  
  // Rule: Check if logged-in user is 'Administrador' to show value, else mask it.
  const isAuthorized = userRole === 'Administrador';

  return (
    <div className="space-y-6 text-slate-100">
      
      {/* Stats Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Metric Card 1: Residences */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-md">
          <div className="flex justify-between items-start text-slate-400 text-xs font-semibold uppercase">
            <span>Unidades Cadastradas</span>
            <span className="p-1.5 rounded bg-blue-500/10 text-blue-400">🏠</span>
          </div>
          <p className="text-2xl font-extrabold mt-3 text-white">
            {unidadesCount} / {unidadesTotal}
          </p>
          <div className="mt-2 text-xs text-emerald-400 font-medium">
            <span>100% integradas</span>
          </div>
        </div>

        {/* Metric Card 2: Delinquency (RBAC Restricted) */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-md transition-all">
          <div className="flex justify-between items-start text-slate-400 text-xs font-semibold uppercase">
            <span>Inadimplência Analítica</span>
            <span className="p-1.5 rounded bg-red-500/10 text-red-400">⚠️</span>
          </div>
          
          {/* Conditional rendering based on role authorization */}
          {isAuthorized ? (
            <>
              <p className="text-2xl font-extrabold mt-3 text-red-400 animate-fade-in">
                R$ {inadimplenciaValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <div className="mt-2 text-xs text-red-400 font-medium">
                <span>3 Residências em atraso</span>
              </div>
            </>
          ) : (
            <>
              <p className="text-2xl font-extrabold mt-3 text-slate-500 select-none tracking-widest">
                R$ •••••••
              </p>
              <div className="mt-2 text-xs text-amber-500 font-semibold flex items-center gap-1.5">
                <span>🔒 Acesso Restrito ao Administrador</span>
              </div>
            </>
          )}
        </div>

        {/* Metric Card 3: Portaria Entries */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-md">
          <div className="flex justify-between items-start text-slate-400 text-xs font-semibold uppercase">
            <span>Acessos Hoje (Portaria)</span>
            <span className="p-1.5 rounded bg-amber-500/10 text-amber-400">🛡️</span>
          </div>
          <p className="text-2xl font-extrabold mt-3 text-white">
            {acessosCount} Entradas
          </p>
          <div className="mt-2 text-xs text-emerald-400 font-medium">
            <span>Rondas e fluxo normal</span>
          </div>
        </div>

        {/* Metric Card 4: Reserves */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-md">
          <div className="flex justify-between items-start text-slate-400 text-xs font-semibold uppercase">
            <span>Reservas Confirmadas</span>
            <span className="p-1.5 rounded bg-emerald-500/10 text-emerald-400">🎉</span>
          </div>
          <p className="text-2xl font-extrabold mt-3 text-white">
            {reservasCount} Ativas
          </p>
          <div className="mt-2 text-xs text-amber-500 font-medium">
            <span>Final de semana movimentado</span>
          </div>
        </div>

      </div>

      {/* Embedded SVG Graphical Simulation in standard React JSX */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-md">
          <h3 className="font-bold text-sm text-white uppercase tracking-wider mb-1">Fluxo de Portaria (Por Horário)</h3>
          <p className="text-xs text-slate-400 mb-6">Entradas e saídas de visitantes/prestadores no dia atual</p>
          
          <div className="h-44 flex items-end justify-between border-b border-slate-800 pb-2">
            {[20, 60, 45, 80, 50, 95, 25].map((val, idx) => (
              <div key={idx} className="flex flex-col items-center w-[12%] group relative">
                <div 
                  style={{ height: `${val}%` }} 
                  className={`w-full rounded-t transition-all duration-300 ${
                    idx === 5 ? 'bg-blue-600 border-t-2 border-blue-400' : 'bg-blue-600/30'
                  }`}
                />
                <span className="text-[10px] text-slate-500 mt-2">
                  {idx * 2 + 8}:00
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-md">
          <h3 className="font-bold text-sm text-white uppercase tracking-wider mb-1">Status de Ocupação</h3>
          <p className="text-xs text-slate-400 mb-6">Taxas operacionais de áreas da associação</p>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Salão de Festas</span>
                <span className="text-emerald-400 font-semibold">Disponível</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[25%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Churrasqueira da Piscina A</span>
                <span className="text-red-400 font-semibold">Ocupada</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div className="bg-red-500 h-full w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

import React, { useState } from 'react';

interface Proposal {
  id: number;
  number: string;
  category: string;
  title: string;
  description: string;
  yesVotes: number;
  noVotes: number;
}

interface PastAssembly {
  id: number;
  title: string;
  date: string;
  approvedTopics: string;
  participants: number;
}

export const Assemblies: React.FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>([
    {
      id: 1,
      number: "Pauta #01 - Orçamento",
      category: "financeiro",
      title: "Reajuste da Cota Associativa (IPCA + 4.5%)",
      description: "Aprovação do reajuste anual para cobrir os novos contratos de ronda motorizada e reajuste da folha dos colaboradores.",
      yesVotes: 12,
      noVotes: 4,
    },
    {
      id: 2,
      number: "Pauta #02 - Segurança",
      category: "segurança",
      title: "Aquisição de Câmeras IP Inteligentes",
      description: "Substituição das câmeras analógicas do perímetro por novos modelos IP Intelbras com analíticos de vídeo inteligente para a portaria.",
      yesVotes: 15,
      noVotes: 5,
    }
  ]);

  const [voted, setVoted] = useState<Record<number, boolean>>({});

  const handleVote = (id: number, type: 'yes' | 'no') => {
    if (voted[id]) {
      alert("Você já registrou seu voto para esta pauta!");
      return;
    }

    setProposals(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          yesVotes: type === 'yes' ? p.yesVotes + 1 : p.yesVotes,
          noVotes: type === 'no' ? p.noVotes + 1 : p.noVotes
        };
      }
      return p;
    }));

    setVoted(prev => ({ ...prev, [id]: true }));
    alert(`Seu voto ("${type === 'yes' ? 'SIM' : 'NÃO'}") foi registrado e criptografado com sucesso!`);
  };

  const [pastAssemblies] = useState<PastAssembly[]>([
    { id: 1, title: "AGE 04/2026 - Obras e Pavimentação", date: "15/04/2026", approvedTopics: "Asfalto Lotes 10 a 40 (Sim - 88%)", participants: 142 },
    { id: 2, title: "AGO 03/2026 - Eleição de Conselho", date: "10/03/2026", approvedTopics: "Chapa 1 - Gestão Transparência (72%)", participants: 210 }
  ]);

  return (
    <div className="space-y-6 text-slate-100">
      {/* Current Active Assembly Panel */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-6">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4 flex-wrap gap-4 select-none">
          <div>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              Em Andamento
            </span>
            <h2 className="text-lg font-bold text-white uppercase mt-2">Assembleia Geral Ordinária</h2>
            <p className="text-xs text-slate-400">Previsão Orçamentária 2026 & Modernização Tecnológica</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase font-bold">Período de Votação:</p>
            <p className="text-xs font-semibold text-white font-mono">12/06/2026 a 25/06/2026</p>
          </div>
        </div>

        {/* Proposals Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {proposals.map((p) => {
            const total = p.yesVotes + p.noVotes;
            const yesPct = total > 0 ? Math.round((p.yesVotes / total) * 100) : 0;
            const noPct = total > 0 ? Math.round((p.noVotes / total) * 100) : 0;

            return (
              <div key={p.id} className="bg-slate-950/80 border border-slate-800 p-5 rounded-xl flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider border ${
                    p.category === 'financeiro' 
                      ? 'bg-blue-600/10 text-blue-400 border-blue-500/20' 
                      : 'bg-purple-600/10 text-purple-400 border-purple-500/20'
                  }`}>
                    {p.number}
                  </span>
                  <h3 className="font-bold text-white text-base">{p.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{p.description}</p>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-900">
                  {/* Results Progress Bars */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                        <span>Sim: {p.yesVotes} votos</span>
                        <span className="text-emerald-400">{yesPct}%</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${yesPct}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                        <span>Não: {p.noVotes} votos</span>
                        <span className="text-red-400">{noPct}%</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-red-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${noPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Vote Actions */}
                  <div className="pt-2">
                    {voted[p.id] ? (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg text-center">
                        <span className="text-emerald-400 text-xs font-bold">✓ Voto Registrado com Sucesso!</span>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleVote(p.id, 'yes')}
                          className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold py-2 rounded text-xs transition-colors"
                        >
                          Votar SIM
                        </button>
                        <button
                          onClick={() => handleVote(p.id, 'no')}
                          className="flex-1 bg-red-700 hover:bg-red-600 text-white font-semibold py-2 rounded text-xs transition-colors"
                        >
                          Votar NÃO
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Past Assemblies History Table */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-4">
        <div>
          <h2 className="text-sm font-bold text-white uppercase">Histórico de Assembleias Concluídas</h2>
          <p className="text-[11px] text-slate-400">Atas lavradas e registradas em cartório com resultados finais</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3 border-b border-slate-800">Assembleia Geral</th>
                <th className="p-3 border-b border-slate-800">Data de Conclusão</th>
                <th className="p-3 border-b border-slate-800">Pautas Aprovadas</th>
                <th className="p-3 border-b border-slate-800">Participantes</th>
                <th className="p-3 border-b border-slate-800">Status</th>
                <th className="p-3 border-b border-slate-800 text-center">Ata lavrada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {pastAssemblies.map((assembly) => (
                <tr key={assembly.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-3 font-semibold text-white">{assembly.title}</td>
                  <td className="p-3 font-mono text-slate-400">{assembly.date}</td>
                  <td className="p-3 text-slate-300">{assembly.approvedTopics}</td>
                  <td className="p-3 text-slate-400">{assembly.participants} Proprietários</td>
                  <td className="p-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Registrado
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-center">
                      <button 
                        onClick={() => alert(`Ata da assembleia "${assembly.title}" baixada com sucesso!`)}
                        className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-semibold py-1.5 px-3 rounded text-[11px] transition-colors flex items-center gap-1"
                      >
                        📄 PDF da Ata
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';

interface CommonArea {
  id: number;
  name: string;
  capacity: number;
  cleaningFee: number;
  status: 'Livre' | 'Ocupada';
}

export const CommonAreas: React.FC = () => {
  const [areas, setAreas] = useState<CommonArea[]>([
    { id: 1, name: "Salão de Festas Principal", capacity: 150, cleaningFee: 150.00, status: "Livre" },
    { id: 2, name: "Churrasqueira A", capacity: 30, cleaningFee: 50.00, status: "Ocupada" },
    { id: 3, name: "Quadra Esportiva", capacity: 20, cleaningFee: 0.00, status: "Livre" },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [fee, setFee] = useState("");
  const [status, setStatus] = useState<'Livre' | 'Ocupada'>("Livre");

  const openModal = (area: CommonArea | null = null) => {
    if (area) {
      setEditId(area.id);
      setName(area.name);
      setCapacity(area.capacity.toString());
      setFee(area.cleaningFee.toString());
      setStatus(area.status);
    } else {
      setEditId(null);
      setName("");
      setCapacity("50");
      setFee("100.00");
      setStatus("Livre");
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCap = parseInt(capacity, 10) || 0;
    const newFee = parseFloat(fee) || 0;

    if (editId !== null) {
      // Edit mode
      setAreas(prev => prev.map(a => a.id === editId ? {
        ...a,
        name,
        capacity: newCap,
        cleaningFee: newFee,
        status
      } : a));
    } else {
      // Add mode
      const newArea: CommonArea = {
        id: areas.length + 1,
        name,
        capacity: newCap,
        cleaningFee: newFee,
        status
      };
      setAreas(prev => [...prev, newArea]);
    }
    closeModal();
  };

  const handleDelete = (id: number, areaName: string) => {
    if (window.confirm(`Tem certeza de que deseja excluir a área comum "${areaName}"?`)) {
      setAreas(prev => prev.filter(a => a.id !== id));
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Cards Display */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white uppercase font-sans">Listagem das Áreas Comuns</h2>
            <p className="text-xs text-slate-400 font-sans">Visualização e controle de taxas e limites</p>
          </div>
          <button
            onClick={() => openModal(null)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded text-xs transition-colors flex items-center gap-1"
          >
            <span>➕ Incluir Novo</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {areas.map((a) => (
            <div key={a.id} className="relative bg-slate-950/80 border border-slate-800 p-5 rounded-xl space-y-3">
              <span className={`absolute top-4 right-4 text-[10px] font-bold px-2 py-0.5 rounded ${
                a.status === 'Livre' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {a.status}
              </span>
              <h4 className="font-bold text-white text-base">{a.name}</h4>
              <div className="text-xs text-slate-400 space-y-1">
                <p>Capacidade: {a.capacity} Pessoas</p>
                <p>Taxa Limpeza: {a.cleaningFee > 0 ? `R$ ${a.cleaningFee.toFixed(2).replace('.', ',')}` : 'Grátis'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Table Display with Action Columns */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white uppercase">Tabela Administrativa de Áreas Comuns</h3>
          <p className="text-[11px] text-slate-400">Gerenciamento com ações de alteração e exclusão</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3 border-b border-slate-800">Área Comum</th>
                <th className="p-3 border-b border-slate-800">Capacidade</th>
                <th className="p-3 border-b border-slate-800">Taxa de Limpeza</th>
                <th className="p-3 border-b border-slate-800">Status</th>
                <th className="p-3 border-b border-slate-800 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {areas.map((a) => (
                <tr key={a.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-3 font-semibold text-white">{a.name}</td>
                  <td className="p-3 text-slate-300">{a.capacity} Pessoas</td>
                  <td className="p-3 text-slate-400">
                    {a.cleaningFee > 0 ? `R$ ${a.cleaningFee.toFixed(2).replace('.', ',')}` : 'Grátis'}
                  </td>
                  <td className="p-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      a.status === 'Livre' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => openModal(a)}
                        className="text-blue-500 hover:text-blue-400 transition-colors p-1"
                        title="Alterar"
                      >
                        <svg className="w-4 h-4 fill-currentColor" viewBox="0 0 24 24">
                          <path d="M3 17.25V21h4.25L17.81 9.94l-4.25-4.25L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 4.25 4.25 1.83-1.83z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(a.id, a.name)}
                        className="text-red-500 hover:text-red-400 transition-colors p-1"
                        title="Excluir"
                      >
                        <svg className="w-4 h-4 fill-currentColor" viewBox="0 0 24 24">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5L9 4H5v2h14V4z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DYNAMIC FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm uppercase">
                {editId !== null ? 'Editar Área Comum' : 'Incluir Área Comum'}
              </h3>
              <button type="button" onClick={closeModal} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Área Comum (Nome)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Capacidade (Pessoas)</label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Taxa de Limpeza (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'Livre' | 'Ocupada')}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                >
                  <option value="Livre">Livre</option>
                  <option value="Ocupada">Ocupada</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 rounded text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded text-xs transition-colors"
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
export default CommonAreas;

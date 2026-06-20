import React, { useState } from 'react';

interface Reservation {
  id: string;
  area: string;
  resident: string;
  date: string;
  fee: number;
  status: 'Confirmado' | 'Pendente' | 'Cancelado';
}

export const Reservations: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([
    { id: "#001", area: "Churrasqueira da Piscina A", resident: "Carlos Henrique", date: "05/06/2026", fee: 50.00, status: "Confirmado" },
    { id: "#002", area: "Salão de Festas Principal", resident: "Mariana Souza", date: "10/06/2026", fee: 150.00, status: "Pendente" },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form Fields
  const [area, setArea] = useState("");
  const [resident, setResident] = useState("");
  const [date, setDate] = useState("");
  const [fee, setFee] = useState("");
  const [status, setStatus] = useState<'Confirmado' | 'Pendente' | 'Cancelado'>("Confirmado");

  const openModal = (res: Reservation | null = null) => {
    if (res) {
      setEditId(res.id);
      setArea(res.area);
      setResident(res.resident);
      setDate(res.date);
      setFee(res.fee.toString());
      setStatus(res.status);
    } else {
      setEditId(null);
      setArea("");
      setResident("");
      setDate("12/06/2026");
      setFee("50.00");
      setStatus("Confirmado");
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericFee = parseFloat(fee) || 0;

    if (editId !== null) {
      // Edit mode
      setReservations(prev => prev.map(r => r.id === editId ? {
        ...r,
        area,
        resident,
        date,
        fee: numericFee,
        status
      } : r));
    } else {
      // Add mode
      const nextId = `#00${reservations.length + 10}`;
      const newRes: Reservation = {
        id: nextId,
        area,
        resident,
        date,
        fee: numericFee,
        status
      };
      setReservations(prev => [...prev, newRes]);
    }
    closeModal();
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Tem certeza de que deseja excluir a reserva do morador "${name}"?`)) {
      setReservations(prev => prev.filter(r => r.id !== id));
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-6 text-slate-100">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white uppercase">Lista Geral de Reservas</h2>
          <p className="text-xs text-slate-400">Administração e monitoramento de eventos agendados</p>
        </div>
        <button
          onClick={() => openModal(null)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded text-xs transition-colors flex items-center gap-1"
        >
          <span>➕ Incluir Novo</span>
        </button>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
            <tr>
              <th className="p-3 border-b border-slate-800">ID</th>
              <th className="p-3 border-b border-slate-800">Área</th>
              <th className="p-3 border-b border-slate-800">Morador</th>
              <th className="p-3 border-b border-slate-800">Data Reserva</th>
              <th className="p-3 border-b border-slate-800">Taxa Lançada</th>
              <th className="p-3 border-b border-slate-800">Status</th>
              <th className="p-3 border-b border-slate-800 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {reservations.map((res) => (
              <tr key={res.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="p-3 font-mono text-slate-400 font-semibold">{res.id}</td>
                <td className="p-3 font-semibold text-white">{res.area}</td>
                <td className="p-3 text-slate-300">{res.resident}</td>
                <td className="p-3 font-mono text-slate-400">{res.date}</td>
                <td className="p-3 font-semibold text-emerald-400">
                  R$ {res.fee.toFixed(2).replace('.', ',')}
                </td>
                <td className="p-3">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded ${
                    res.status === 'Confirmado'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : res.status === 'Pendente'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {res.status}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => openModal(res)}
                      className="text-blue-500 hover:text-blue-400 transition-colors p-1"
                      title="Alterar"
                    >
                      <svg className="w-4 h-4 fill-currentColor" viewBox="0 0 24 24">
                        <path d="M3 17.25V21h4.25L17.81 9.94l-4.25-4.25L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 4.25 4.25 1.83-1.83z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(res.id, res.resident)}
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

      {/* DYNAMIC FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm uppercase">
                {editId !== null ? 'Editar Reserva' : 'Incluir Reserva'}
              </h3>
              <button type="button" onClick={closeModal} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Área Reservada</label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                  placeholder="Ex: Salão de Festas Principal"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Morador / Solicitante</label>
                <input
                  type="text"
                  value={resident}
                  onChange={(e) => setResident(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Data da Reserva</label>
                <input
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono"
                  placeholder="Ex: 12/06/2026"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Taxa Lançada (R$)</label>
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
                  onChange={(e) => setStatus(e.target.value as 'Confirmado' | 'Pendente' | 'Cancelado')}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                >
                  <option value="Confirmado">Confirmado</option>
                  <option value="Pendente">Pendente</option>
                  <option value="Cancelado">Cancelado</option>
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
export default Reservations;

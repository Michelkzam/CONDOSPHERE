import React, { useState } from 'react';
import * as XLSX from 'xlsx';

interface Vehicle {
  id: number;
  plate: string;
  model: string;
  color: string;
  owner: string;
}

export const Vehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    { id: 1, plate: "ABC-1D23", model: "Toyota Corolla", color: "Prata", owner: "Carlos Henrique" },
    { id: 2, plate: "XYZ-9F87", model: "Honda Civic", color: "Preto", owner: "Mariana Souza" },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  // Form Fields
  const [plate, setPlate] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [owner, setOwner] = useState("");

  const openModal = (veh: Vehicle | null = null) => {
    if (veh) {
      setEditId(veh.id);
      setPlate(veh.plate);
      setModel(veh.model);
      setColor(veh.color);
      setOwner(veh.owner);
    } else {
      setEditId(null);
      setPlate("");
      setModel("");
      setColor("");
      setOwner("");
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editId !== null) {
      // Edit mode
      setVehicles(prev => prev.map(v => v.id === editId ? {
        ...v,
        plate,
        model,
        color,
        owner
      } : v));
    } else {
      // Add mode
      const newVeh: Vehicle = {
        id: vehicles.length + 1,
        plate,
        model,
        color,
        owner
      };
      setVehicles(prev => [...prev, newVeh]);
    }
    closeModal();
  };

  const handleDelete = (id: number, plate: string) => {
    if (window.confirm(`Tem certeza de que deseja excluir o veículo de placa "${plate}"?`)) {
      setVehicles(prev => prev.filter(v => v.id !== id));
    }
  };

  const handleDownloadModel = () => {
    const headers = [["Placa", "Veículo", "Cor", "Proprietário"]];
    const rows = vehicles.map(v => [v.plate, v.model, v.color, v.owner]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, "Veiculos");
    XLSX.writeFile(wb, "modelo_veiculos_condosphere.xlsx");
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const binaryString = event.target?.result;
        const workbook = XLSX.read(binaryString, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

        const newVehicles = jsonData.map((row, idx) => ({
          id: vehicles.length + idx + 1,
          plate: row["Placa"] || "AAA-0000",
          model: row["Veículo"] || "Veículo Novo",
          color: row["Cor"] || "Branco",
          owner: row["Proprietário"] || "Sem Nome"
        }));

        setVehicles((prev) => [...prev, ...newVehicles]);
        alert(`${newVehicles.length} veículos importados com sucesso!`);
      } catch (err) {
        alert("Erro ao ler o arquivo Excel. Certifique-se que segue o padrão de colunas do modelo.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; // Reset
  };

  const filteredVehicles = vehicles.filter(v => 
    v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.owner.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-6 text-slate-100">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white uppercase">Frota Cadastrada</h2>
          <p className="text-xs text-slate-400">Controle de placas e veículos autorizados das associações</p>
        </div>
        
        {/* ACTION BUTTONS */}
        <div className="flex gap-2">
          <button
            onClick={() => openModal(null)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded text-xs transition-colors flex items-center gap-1"
          >
            <span>➕ Incluir Novo</span>
          </button>
          <button
            onClick={handleDownloadModel}
            className="bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded text-xs transition-colors flex items-center gap-1 border border-slate-700"
          >
            <span>📥 Baixar Modelo (.xlsx)</span>
          </button>
          <label className="bg-emerald-700 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded text-xs transition-colors flex items-center gap-1 cursor-pointer">
            <span>📤 Importar Documento (.xlsx)</span>
            <input
              type="file"
              accept=".xlsx"
              onChange={handleImportExcel}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* SEARCH */}
      <div className="form-group">
        <label className="block text-xs text-slate-400 mb-1 font-semibold">Busca Rápida de Frota</label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Pesquise por placa, modelo, cor ou proprietário..."
          className="w-full text-xs bg-slate-950 border border-slate-800 rounded p-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
            <tr>
              <th className="p-3 border-b border-slate-800">Placa</th>
              <th className="p-3 border-b border-slate-800">Veículo</th>
              <th className="p-3 border-b border-slate-800">Cor</th>
              <th className="p-3 border-b border-slate-800">Proprietário</th>
              <th className="p-3 border-b border-slate-800 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredVehicles.map((veh) => (
              <tr key={veh.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="p-3 font-mono font-bold tracking-wider text-blue-400">{veh.plate}</td>
                <td className="p-3 font-semibold text-white">{veh.model}</td>
                <td className="p-3 text-slate-400">{veh.color}</td>
                <td className="p-3 text-slate-300">{veh.owner}</td>
                <td className="p-3">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => openModal(veh)}
                      className="text-blue-500 hover:text-blue-400 transition-colors p-1"
                      title="Alterar"
                    >
                      <svg className="w-4 h-4 fill-currentColor" viewBox="0 0 24 24">
                        <path d="M3 17.25V21h4.25L17.81 9.94l-4.25-4.25L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 4.25 4.25 1.83-1.83z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(veh.id, veh.plate)}
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
            {filteredVehicles.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-slate-500">Nenhum veículo encontrado</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* DYNAMIC FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm uppercase">
                {editId !== null ? 'Editar Veículo' : 'Incluir Veículo'}
              </h3>
              <button type="button" onClick={closeModal} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Placa</label>
                <input
                  type="text"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono"
                  placeholder="Ex: ABC-1D23"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Veículo (Marca/Modelo)</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                  placeholder="Ex: Toyota Corolla"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Cor</label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                  placeholder="Ex: Prata"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Proprietário</label>
                <input
                  type="text"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                  required
                />
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
export default Vehicles;

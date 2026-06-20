import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabaseClient';

interface Resident {
  id: any; // Can be string (UUID) or number (mock ID)
  name: string;
  cpf: string;
  contact: string;
  role: string;
  isAssociated: boolean;
  isResident: boolean;
  residenceId: any; // Associated residence key
}

interface ResidentsProps {
  residents: Resident[];
  setResidents: React.Dispatch<React.SetStateAction<Resident[]>>;
  residences: any[];
  setReceivables: React.Dispatch<React.SetStateAction<any[]>>;
}

export const Residents: React.FC<ResidentsProps> = ({ residents, setResidents, residences, setReceivables }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<any>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [contact, setContact] = useState("");
  const [role, setRole] = useState("Proprietário");
  const [category, setCategory] = useState("Morador");
  const [resId, setResidenceId] = useState<string>("none"); // Selected residence ID

  const openModal = (res: Resident | null = null) => {
    if (res) {
      setEditId(res.id);
      setName(res.name);
      setCpf(res.cpf);
      setContact(res.contact);
      setRole(res.role);
      setCategory(res.isAssociated ? "Associado" : "Morador");
      setResidenceId(res.residenceId ? res.residenceId.toString() : "none");
    } else {
      setEditId(null);
      setName("");
      setCpf("");
      setContact("");
      setRole("Proprietário");
      setCategory("Morador");
      setResidenceId("none");
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isAssociated = category === "Associado";
    const isResident = category === "Morador" || category === "Associado";
    const associatedResidenceId = resId === "none" ? null : resId;

    if (editId !== null) {
      // Edit mode: update resident list
      const oldRes = residents.find(r => r.id === editId);
      const updatedResidents = residents.map(r => r.id === editId ? {
        ...r,
        name,
        cpf,
        contact,
        role,
        isAssociated,
        isResident,
        residenceId: associatedResidenceId
      } : r);
      setResidents(updatedResidents);

      // Instantly update corresponding account receivable in the hoisted state
      setReceivables(prev => prev.map((r: any) => {
        if (r.owner === oldRes?.name) {
          return {
            ...r,
            owner: name,
            identifier: isAssociated ? "Taxa Associativa" : "Mensalidade Morador",
            baseValue: isAssociated ? 300.00 : 150.00
          };
        }
        return r;
      }));

      // --- SUPABASE SYNC (UPDATE) ---
      supabase.from('residents').update({
        name,
        cpf,
        contact,
        role,
        is_associated: isAssociated,
        is_resident: isResident,
        residence_id: associatedResidenceId
      }).eq('id', editId).then(({ error }) => {
        if (error) console.error("[SUPABASE ERROR] Update resident failed:", error.message);
      });

    } else {
      // Add mode: create new resident
      const tempId = -Math.floor(Math.random() * 10000);
      const newRes: Resident = {
        id: tempId,
        name,
        cpf,
        contact,
        role,
        isAssociated,
        isResident,
        residenceId: associatedResidenceId
      };
      setResidents([...residents, newRes]);

      // --- SUPABASE SYNC (INSERT) ---
      supabase.from('residents').insert([{
        name,
        cpf,
        contact,
        role,
        is_associated: isAssociated,
        is_resident: isResident,
        residence_id: associatedResidenceId
      }]).select().then(({ data, error }) => {
        if (error) {
          console.error("[SUPABASE ERROR] Insert resident failed:", error.message);
        } else if (data && data[0]) {
          // Replace temp ID with actual UUID string
          setResidents(prev => prev.map(r => r.id === tempId ? {
            ...r,
            id: data[0].id
          } : r));
        }
      });
    }

    closeModal();
  };

  const handleDelete = (id: any, name: string) => {
    if (window.confirm(`Tem certeza de que deseja excluir o morador "${name}"?`)) {
      setResidents(prev => prev.filter(r => r.id !== id));
      
      // Instantly remove corresponding accounts receivable!
      setReceivables(prev => prev.filter((r: any) => r.owner !== name));

      // --- SUPABASE SYNC (DELETE) ---
      supabase.from('residents').delete().eq('id', id).then(({ error }) => {
        if (error) console.error("[SUPABASE ERROR] Delete resident failed:", error.message);
      });
    }
  };

  const handleDownloadModel = () => {
    const headers = [["Nome", "CPF", "Contato", "Função", "Associado", "Morador", "Residência Vinculada"]];
    const rows = residents.map(r => [
      r.name,
      r.cpf,
      r.contact,
      r.role,
      r.isAssociated ? "Sim" : "Não",
      r.isResident ? "Sim" : "Não",
      residences.find(res => res.id === r.residenceId)?.identifier || "Nenhuma"
    ]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, "Moradores");
    XLSX.writeFile(wb, "modelo_moradores_condosphere.xlsx");
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

        const newResidents = jsonData.map((row, idx) => {
          const resIdent = row["Residência Vinculada"] || "Nenhuma";
          const matchedResidence = residences.find(res => res.identifier === resIdent);
          const associatedResidenceId = matchedResidence ? matchedResidence.id : null;

          return {
            id: -Math.floor(Math.random() * 100000) - idx, // Temp ID
            name: row["Nome"] || "Morador Novo",
            cpf: row["CPF"] || "000.000.000-00",
            contact: row["Contato"] || "(00) 00000-0000",
            role: row["Função"] || "Inquilino",
            isAssociated: row["Associado"] === "Sim",
            isResident: row["Morador"] === "Sim",
            residenceId: associatedResidenceId
          };
        });

        setResidents([...residents, ...newResidents]);

        // --- SUPABASE SYNC (BULK INSERT) ---
        const payloads = newResidents.map(mor => ({
          name: mor.name,
          cpf: mor.cpf,
          contact: mor.contact,
          role: mor.role,
          is_associated: mor.isAssociated,
          is_resident: mor.isResident,
          residence_id: mor.residenceId
        }));

        supabase.from('residents').insert(payloads).select().then(({ data, error }) => {
          if (error) {
            console.error("[SUPABASE ERROR] Bulk insert residents failed:", error.message);
          } else if (data && data.length > 0) {
            // Re-load list to get proper UUIDs from Supabase
            supabase.from('residents').select('*').then(({ data: freshData }) => {
              if (freshData) {
                setResidents(freshData.map((m: any) => ({
                  id: m.id,
                  name: m.name,
                  cpf: m.cpf,
                  contact: m.contact,
                  role: m.role,
                  isAssociated: m.is_associated,
                  isResident: m.is_resident,
                  residenceId: m.residence_id
                })));
              }
            });
          }
        });

        alert(`${newResidents.length} moradores importados com sucesso!`);
      } catch (err) {
        alert("Erro ao ler o arquivo Excel. Certifique-se que segue o padrão de colunas do modelo.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; // Reset
  };

  const filteredResidents = residents.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.cpf.includes(searchTerm) ||
    r.contact.includes(searchTerm) ||
    r.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-6 text-slate-100">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white uppercase">Fichas Cadastrais de Moradores</h2>
          <p className="text-xs text-slate-400">Organize os associados e controle as categorias do condomínio</p>
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
        <label className="block text-xs text-slate-400 mb-1 font-semibold">Busca Rápida de Moradores</label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Pesquise por nome, CPF ou função..."
          className="w-full text-xs bg-slate-950 border border-slate-800 rounded p-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
            <tr>
              <th className="p-3 border-b border-slate-800">Nome</th>
              <th className="p-3 border-b border-slate-800">CPF</th>
              <th className="p-3 border-b border-slate-800">Contato</th>
              <th className="p-3 border-b border-slate-800">Função</th>
              <th className="p-3 border-b border-slate-800">Residência Vinculada</th>
              <th className="p-3 border-b border-slate-800 text-center">Associado</th>
              <th className="p-3 border-b border-slate-800 text-center">Morador</th>
              <th className="p-3 border-b border-slate-800 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredResidents.map((res) => {
              const linkedResidence = residences.find(r => r.id === res.residenceId);
              const residenceIdentifier = linkedResidence ? linkedResidence.identifier : "Sem Vínculo";

              return (
                <tr key={res.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-3 font-semibold text-white">{res.name}</td>
                  <td className="p-3 text-slate-300 font-mono">{res.cpf}</td>
                  <td className="p-3 text-slate-400">{res.contact}</td>
                  <td className="p-3 text-blue-400 font-medium">{res.role}</td>
                  <td className="p-3 text-emerald-400 font-semibold">{residenceIdentifier}</td>
                  <td className="p-3 text-center">
                    <input type="checkbox" checked={res.isAssociated} readOnly className="rounded bg-slate-950 border-slate-800 text-blue-600 cursor-not-allowed" />
                  </td>
                  <td className="p-3 text-center">
                    <input type="checkbox" checked={res.isResident} readOnly className="rounded bg-slate-950 border-slate-800 text-blue-600 cursor-not-allowed" />
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
                        onClick={() => handleDelete(res.id, res.name)}
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
              );
            })}
            {filteredResidents.length === 0 && (
              <tr>
                <td colSpan={8} className="p-4 text-center text-slate-500">Nenhum morador encontrado</td>
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
                {editId !== null ? 'Editar Morador' : 'Incluir Morador'}
              </h3>
              <button type="button" onClick={closeModal} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Nome Completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">CPF</label>
                <input
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono"
                  placeholder="Ex: 000.000.000-00"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Contato</label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                  placeholder="Ex: (11) 98765-4321"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Função</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                >
                  <option value="Proprietário">Proprietário</option>
                  <option value="Inquilino">Inquilino</option>
                  <option value="Dependente">Dependente</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Vincular a uma Residência (Relacionamento Supabase)</label>
                <select
                  value={resId}
                  onChange={(e) => setResidenceId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                >
                  <option value="none">Nenhuma (Não Vinculado)</option>
                  {residences.map((res) => (
                    <option key={res.id} value={res.id.toString()}>
                      {res.identifier} ({res.owner})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Características / Vínculo (Dropdown)</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                >
                  <option value="Associado">Associado</option>
                  <option value="Morador">Morador</option>
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
export default Residents;

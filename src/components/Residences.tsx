import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabaseClient';

interface Residence {
  id: any; // Can be string (UUID) or number (mock ID)
  identifier: string;
  owner: string;
  address: string;
  profileName: string;
  baseValue: number;
  status: string;
}

const FINANCIAL_PROFILES = [
  { name: 'Perfil Lote Padrão', baseValue: 300.00 },
  { name: 'Perfil Lote Luxo', baseValue: 500.00 },
  { name: 'Perfil Comercial', baseValue: 750.00 },
  { name: 'Perfil Isento', baseValue: 0.00 }
];

interface ResidencesProps {
  residences: Residence[];
  setResidences: React.Dispatch<React.SetStateAction<Residence[]>>;
  setReceivables: React.Dispatch<React.SetStateAction<any[]>>;
}

export const Residences: React.FC<ResidencesProps> = ({ residences, setResidences, setReceivables }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<any>(null);

  // Form Fields
  const [ident, setIdent] = useState("");
  const [owner, setOwner] = useState("");
  const [addr, setAddr] = useState("");
  const [profile, setProfile] = useState("Perfil Lote Padrão");
  const [val, setVal] = useState("300.00");
  const [status, setStatus] = useState("Ativo");

  const openModal = (res: Residence | null = null) => {
    if (res) {
      setEditId(res.id);
      setIdent(res.identifier);
      setOwner(res.owner);
      setAddr(res.address);
      setProfile(res.profileName);
      setVal(res.baseValue.toString());
      setStatus(res.status);
    } else {
      setEditId(null);
      setIdent("");
      setOwner("");
      setAddr("");
      setProfile("Perfil Lote Padrão");
      setVal("300.00");
      setStatus("Ativo");
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
  };

  const handleProfileChange = (profileName: string) => {
    setProfile(profileName);
    const matched = FINANCIAL_PROFILES.find(p => p.name === profileName);
    if (matched) {
      setVal(matched.baseValue.toFixed(2));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericValue = parseFloat(val) || 0;

    if (editId !== null) {
      // Edit mode: update residence
      const oldRes = residences.find(r => r.id === editId);
      const updatedResidences = residences.map(r => r.id === editId ? {
        ...r,
        identifier: ident,
        owner,
        address: addr,
        profileName: profile,
        baseValue: numericValue,
        status
      } : r);
      setResidences(updatedResidences);

      // Instantly update corresponding account receivable in the hoisted state
      setReceivables(prev => prev.map((r: any) => {
        if (r.identifier === oldRes?.identifier || r.identifier === ident) {
          return {
            ...r,
            identifier: ident,
            owner: owner,
            baseValue: numericValue
          };
        }
        return r;
      }));

      // --- SUPABASE SYNC (UPDATE) ---
      supabase.from('residences').update({
        identifier: ident,
        owner: owner,
        address: addr,
        profile_name: profile,
        base_value: numericValue,
        status: status
      }).eq('id', editId).then(({ error }) => {
        if (error) console.error("[SUPABASE ERROR] Update residence failed:", error.message);
      });

    } else {
      // Add mode: create new residence in the hoisted state
      const tempId = -Math.floor(Math.random() * 10000); // Temporary negative ID
      const newRes: Residence = {
        id: tempId,
        identifier: ident,
        owner,
        address: addr,
        profileName: profile,
        baseValue: numericValue,
        status
      };
      setResidences([...residences, newRes]);

      // --- SUPABASE SYNC (INSERT) ---
      supabase.from('residences').insert([{
        identifier: ident,
        owner: owner,
        address: addr,
        profile_name: profile,
        base_value: numericValue,
        status: status
      }]).select().then(({ data, error }) => {
        if (error) {
          console.error("[SUPABASE ERROR] Insert residence failed:", error.message);
        } else if (data && data[0]) {
          // Replace the temporary ID in local state with the actual Supabase UUID
          setResidences(prev => prev.map(r => r.id === tempId ? {
            ...r,
            id: data[0].id
          } : r));
        }
      });
    }
    
    closeModal();
  };

  const handleDelete = (id: any, ident: string) => {
    if (window.confirm(`Tem certeza de que deseja excluir a residência "${ident}"?`)) {
      setResidences(prev => prev.filter(r => r.id !== id));
      
      // Instantly remove corresponding accounts receivable!
      setReceivables(prev => prev.filter((r: any) => r.identifier !== ident));

      // --- SUPABASE SYNC (DELETE) ---
      supabase.from('residences').delete().eq('id', id).then(({ error }) => {
        if (error) console.error("[SUPABASE ERROR] Delete residence failed:", error.message);
      });
    }
  };

  const handleDownloadModel = () => {
    const headers = [["Identificador", "Proprietário Principal", "Endereço Completo", "Perfil Financeiro Associado", "Valor de Base", "Status"]];
    const rows = residences.map(r => [
      r.identifier,
      r.owner,
      r.address,
      r.profileName,
      r.baseValue,
      r.status
    ]);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, "Residencias");
    XLSX.writeFile(wb, "modelo_residencias_condosphere.xlsx");
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

        const newResidences = jsonData.map((row, idx) => {
          const profileName = row["Perfil Financeiro Associado"] || "Perfil Lote Padrão";
          const matched = FINANCIAL_PROFILES.find(p => p.name === profileName);
          const baseValue = matched ? matched.baseValue : (parseFloat(row["Valor de Base"]) || 300.00);

          return {
            id: -Math.floor(Math.random() * 100000) - idx, // Temp ID
            identifier: row["Identificador"] || `Lote ${idx + 101}`,
            owner: row["Proprietário Principal"] || 'Sem Proprietário',
            address: row["Endereço Completo"] || 'Rua Interna',
            profileName,
            baseValue,
            status: row["Status"] || 'Ativo'
          };
        });

        setResidences([...residences, ...newResidences]);

        // --- SUPABASE SYNC (BULK INSERT) ---
        const payloads = newResidences.map(res => ({
          identifier: res.identifier,
          owner: res.owner,
          address: res.address,
          profile_name: res.profileName,
          base_value: res.baseValue,
          status: res.status
        }));

        supabase.from('residences').insert(payloads).select().then(({ data, error }) => {
          if (error) {
            console.error("[SUPABASE ERROR] Bulk insert residences failed:", error.message);
          } else if (data && data.length > 0) {
            // Re-load list to get proper UUIDs from Supabase
            supabase.from('residences').select('*').then(({ data: freshData }) => {
              if (freshData) {
                setResidences(freshData.map((r: any) => ({
                  id: r.id,
                  identifier: r.identifier,
                  owner: r.owner,
                  address: r.address,
                  profileName: r.profile_name,
                  baseValue: Number(r.base_value),
                  status: r.status
                })));
              }
            });
          }
        });

        alert(`${newResidences.length} residências importadas com sucesso!`);
      } catch (err) {
        alert("Erro ao ler o arquivo Excel. Certifique-se que segue o padrão de colunas do modelo.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; // Reset
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-6 text-slate-100">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white uppercase">Módulo Residências & Perfis Financeiros</h2>
          <p className="text-xs text-slate-400">Controle cadastral de lotes e associação de perfis de faturamento em lote</p>
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

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
            <tr>
              <th className="p-3 border-b border-slate-800">Identificador</th>
              <th className="p-3 border-b border-slate-800">Proprietário Principal</th>
              <th className="p-3 border-b border-slate-800">Endereço Completo</th>
              <th className="p-3 border-b border-slate-800">Perfil Financeiro Associado</th>
              <th className="p-3 border-b border-slate-800">Valor de Base</th>
              <th className="p-3 border-b border-slate-800">Status</th>
              <th className="p-3 border-b border-slate-800 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {residences.map((res) => (
              <tr key={res.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="p-3 font-semibold text-white">{res.identifier}</td>
                <td className="p-3 text-slate-300">{res.owner}</td>
                <td className="p-3 text-slate-400">{res.address}</td>
                <td className="p-3 text-blue-400 font-medium">{res.profileName}</td>
                <td className="p-3 font-semibold text-emerald-400">R$ {res.baseValue.toFixed(2).replace('.', ',')}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      res.status === 'Ativo'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}
                  >
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
                      onClick={() => handleDelete(res.id, res.identifier)}
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
                {editId !== null ? 'Editar Residência' : 'Incluir Residência'}
              </h3>
              <button type="button" onClick={closeModal} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Identificador (Ex: Quadra A - Lote 05)</label>
                <input
                  type="text"
                  value={ident}
                  onChange={(e) => setIdent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Proprietário Principal</label>
                <input
                  type="text"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Endereço Completo</label>
                <input
                  type="text"
                  value={addr}
                  onChange={(e) => setAddr(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Perfil Financeiro Associado</label>
                <select
                  value={profile}
                  onChange={(e) => handleProfileChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                >
                  <option value="Perfil Lote Padrão">Perfil Lote Padrão</option>
                  <option value="Perfil Lote Luxo">Perfil Lote Luxo</option>
                  <option value="Perfil Comercial">Perfil Comercial</option>
                  <option value="Perfil Isento">Perfil Isento</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Valor de Base (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={val}
                  onChange={(e) => setVal(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
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

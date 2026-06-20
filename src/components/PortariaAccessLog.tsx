import React, { useState, useRef } from 'react';

interface AccessLog {
  id: number;
  visitorName: string;
  document: string;
  type: 'Visitante' | 'Prestador';
  photoDoc?: string;   // Local Base64 string preview
  photoPerson?: string;// Local Base64 string preview
  vehicle?: {
    type: string;
    plate: string;
    color: string;
    brand: string;
    model: string;
  };
  authorizedBy: string;
  timestamp: string;
}

export const PortariaAccessLog: React.FC = () => {
  const [logs, setLogs] = useState<AccessLog[]>([
    {
      id: 1,
      visitorName: "Marcio Silva",
      document: "RG 44.111.222",
      type: "Prestador",
      photoDoc: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' fill='%2364748b'><rect width='100' height='100'/><text x='50' y='55' fill='white' font-size='10' text-anchor='middle'>DOC PRESET</text></svg>",
      photoPerson: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' fill='%2364748b'><rect width='100' height='100'/><text x='50' y='55' fill='white' font-size='10' text-anchor='middle'>AVATAR PRESET</text></svg>",
      vehicle: {
        type: "Caminhão",
        plate: "MKM-9218",
        color: "Verde",
        brand: "Ford",
        model: "Cargo"
      },
      authorizedBy: "Carlos Henrique (Lote 05)",
      timestamp: "11/06/2026 15:30"
    }
  ]);

  // Form states
  const [visitorName, setVisitorName] = useState('');
  const [visitorDoc, setVisitorDoc] = useState('');
  const [visitorType, setVisitorType] = useState<'Visitante' | 'Prestador'>('Visitante');
  const [authorizedBy, setAuthorizedBy] = useState('Carlos Henrique (Lote 05)');

  // Vehicle states
  const [vehicleType, setVehicleType] = useState<string>('');
  const [plate, setPlate] = useState('');
  const [color, setColor] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');

  // Upload/Capture Base64 State files
  const [photoDocBase64, setPhotoDocBase64] = useState<string>('');
  const [photoPersonBase64, setPhotoPersonBase64] = useState<string>('');

  const docInputRef = useRef<HTMLInputElement>(null);
  const personInputRef = useRef<HTMLInputElement>(null);

  // Read files and convert to Base64 Data URL for real-time offline previews
  const handlePhotoUpload = (type: 'doc' | 'person', file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (type === 'doc') {
        setPhotoDocBase64(result);
      } else {
        setPhotoPersonBase64(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRegisterAccess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName || !visitorDoc) {
      alert("Preencha o nome e documento do visitante!");
      return;
    }

    const newLog: AccessLog = {
      id: logs.length + 1,
      visitorName,
      document: visitorDoc,
      type: visitorType,
      authorizedBy,
      timestamp: new Date().toLocaleString('pt-BR'),
      // Include uploaded Base64 pictures
      photoDoc: photoDocBase64 || undefined,
      photoPerson: photoPersonBase64 || undefined,
      vehicle: vehicleType ? {
        type: vehicleType,
        plate,
        color,
        brand,
        model
      } : undefined
    };

    setLogs((prev) => [newLog, ...prev]);

    // Reset Form
    setVisitorName('');
    setVisitorDoc('');
    setVehicleType('');
    setPlate('');
    setColor('');
    setBrand('');
    setModel('');
    setPhotoDocBase64('');
    setPhotoPersonBase64('');
    alert("Acesso e fotos registrados com sucesso!");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-slate-100">
      
      {/* Registration Form Panel */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg h-fit space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Entrada de Visitante / Prestador</h3>
        
        <form onSubmit={handleRegisterAccess} className="space-y-3">
          <div className="form-group">
            <label className="block text-xs text-slate-400 mb-1 font-semibold uppercase">Nome Completo</label>
            <input 
              type="text" 
              value={visitorName} 
              onChange={e => setVisitorName(e.target.value)} 
              className="w-full text-xs bg-slate-950 border border-slate-800 rounded p-2.5 text-slate-100 focus:outline-none" 
              placeholder="Ex: Daniel Souza"
              required 
            />
          </div>

          <div className="form-group">
            <label className="block text-xs text-slate-400 mb-1 font-semibold uppercase">Documento de Identidade</label>
            <input 
              type="text" 
              value={visitorDoc} 
              onChange={e => setVisitorDoc(e.target.value)} 
              className="w-full text-xs bg-slate-950 border border-slate-800 rounded p-2.5 text-slate-100 focus:outline-none" 
              placeholder="RG ou CPF"
              required 
            />
          </div>

          <div className="form-group">
            <label className="block text-xs text-slate-400 mb-1 font-semibold uppercase">Tipo de Acesso</label>
            <select 
              value={visitorType} 
              onChange={e => setVisitorType(e.target.value as 'Visitante' | 'Prestador')}
              className="w-full text-xs bg-slate-950 border border-slate-800 rounded p-2.5 text-slate-100 focus:outline-none"
            >
              <option value="Visitante">Visitante</option>
              <option value="Prestador">Prestador de Serviço</option>
            </select>
          </div>

          <div className="form-group">
            <label className="block text-xs text-slate-400 mb-1 font-semibold uppercase">Morador Autorizador</label>
            <select 
              value={authorizedBy} 
              onChange={e => setAuthorizedBy(e.target.value)}
              className="w-full text-xs bg-slate-950 border border-slate-800 rounded p-2.5 text-slate-100 focus:outline-none"
            >
              <option value="Carlos Henrique (Lote 05)">Carlos Henrique (Lote 05)</option>
              <option value="Mariana Souza (Lote 12)">Mariana Souza (Lote 12)</option>
              <option value="Roberto de Alencar (Lote 02)">Roberto de Alencar (Lote 02)</option>
            </select>
          </div>

          {/* Replaced Checkboxes with Radio Buttons */}
          <div className="form-group">
            <label className="block text-xs text-slate-400 mb-2 font-semibold uppercase">Tipo de Veículo (Selecione um)</label>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer hover:text-white">
                <input 
                  type="radio" 
                  name="vehicleType"
                  checked={vehicleType === ''}
                  onChange={() => setVehicleType('')}
                  className="bg-slate-950 border-slate-800 text-blue-600 focus:ring-0" 
                />
                <span>Nenhum</span>
              </label>
              {['Carro', 'Moto', 'Caminhão', 'Trator', 'Outros'].map(type => (
                <label key={type} className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer hover:text-white">
                  <input 
                    type="radio" 
                    name="vehicleType"
                    checked={vehicleType === type}
                    onChange={() => setVehicleType(type)}
                    className="bg-slate-950 border-slate-800 text-blue-600 focus:ring-0" 
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Conditional rendering of vehicle inputs */}
          {vehicleType !== '' && (
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg space-y-3 animate-slide-down">
              <span className="block text-[10px] font-bold text-blue-400 uppercase">Cadastro Rápido de Veículo ({vehicleType})</span>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" value={plate} onChange={e => setPlate(e.target.value)} className="w-full text-xs bg-slate-900 border border-slate-800 rounded p-2 text-slate-100" placeholder="Placa" />
                <input type="text" value={color} onChange={e => setColor(e.target.value)} className="w-full text-xs bg-slate-900 border border-slate-800 rounded p-2 text-slate-100" placeholder="Cor" />
                <input type="text" value={brand} onChange={e => setBrand(e.target.value)} className="w-full text-xs bg-slate-900 border border-slate-800 rounded p-2 text-slate-100" placeholder="Marca" />
                <input type="text" value={model} onChange={e => setModel(e.target.value)} className="w-full text-xs bg-slate-900 border border-slate-800 rounded p-2 text-slate-100" placeholder="Modelo" />
              </div>
            </div>
          )}

          {/* Fully Enabled and styled Foto Documento and Foto Pessoa Uploaders */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
            <div style={{ flex: 1 }}>
              <label className="block text-xs text-slate-400 mb-1 font-semibold uppercase">Foto Documento</label>
              <label 
                className="relative flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-lg p-2 text-center text-slate-500 hover:text-white cursor-pointer hover:border-blue-500 transition-all bg-slate-950/40"
                style={{ height: '64px' }}
              >
                {photoDocBase64 ? (
                  <img src={photoDocBase64} alt="Doc Preview" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <span className="text-[10px] font-bold">📷 Carregar Doc</span>
                )}
                <input 
                  type="file" 
                  ref={docInputRef}
                  accept="image/*" 
                  onChange={e => handlePhotoUpload('doc', e.target.files?.[0])}
                  className="hidden" 
                />
              </label>
            </div>
            
            <div style={{ flex: 1 }}>
              <label className="block text-xs text-slate-400 mb-1 font-semibold uppercase">Foto Pessoa</label>
              <label 
                className="relative flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-lg p-2 text-center text-slate-500 hover:text-white cursor-pointer hover:border-blue-500 transition-all bg-slate-950/40"
                style={{ height: '64px' }}
              >
                {photoPersonBase64 ? (
                  <img src={photoPersonBase64} alt="Person Preview" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <span className="text-[10px] font-bold">👤 Capturar Foto</span>
                )}
                <input 
                  type="file" 
                  ref={personInputRef}
                  accept="image/*" 
                  onChange={e => handlePhotoUpload('person', e.target.files?.[0])}
                  className="hidden" 
                />
              </label>
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded text-xs transition-colors"
          >
            AUTORIZAR ENTRADA
          </button>
        </form>
      </div>

      {/* Historical List Panel */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg lg:col-span-2 overflow-x-auto">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Fluxo Recente de Acessos</h3>
        
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
            <tr>
              <th className="p-3">Visitante / Documento</th>
              <th className="p-3">Foto Doc</th>
              <th className="p-3">Foto Pessoa</th>
              <th className="p-3">Tipo</th>
              <th className="p-3">Veículo</th>
              <th className="p-3">Autorizador</th>
              <th className="p-3">Horário</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-slate-800/30">
                <td className="p-3 font-semibold text-white">
                  {log.visitorName}
                  <span className="block text-[10px] text-slate-500 font-normal">{log.document}</span>
                </td>
                <td className="p-3">
                  {log.photoDoc ? (
                    <img src={log.photoDoc} className="w-8 h-8 rounded object-cover border border-slate-800" alt="Document thumbnail" />
                  ) : (
                    <span className="text-slate-500 text-[10px]">Sem foto</span>
                  )}
                </td>
                <td className="p-3">
                  {log.photoPerson ? (
                    <img src={log.photoPerson} className="w-8 h-8 rounded object-cover border border-slate-800" alt="Person thumbnail" />
                  ) : (
                    <span className="text-slate-500 text-[10px]">Sem foto</span>
                  )}
                </td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                    {log.type}
                  </span>
                </td>
                <td className="p-3">
                  {log.vehicle ? (
                    <div>
                      <span className="text-amber-500 font-bold">{log.vehicle.type}</span>
                      <span className="block text-[10px] text-slate-400 font-mono">
                        {log.vehicle.plate.toUpperCase()}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-500">Nenhum</span>
                  )}
                </td>
                <td className="p-3 text-slate-400">{log.authorizedBy}</td>
                <td className="p-3 text-slate-400">{log.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

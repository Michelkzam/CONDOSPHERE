import React, { useState } from 'react';

interface VisitorDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
  userRole: 'Administrador' | 'Portaria' | 'Zelador';
  log: {
    id: number;
    visitorName: string;
    document: string;
    type: 'Visitante' | 'Prestador';
    photoDoc?: string;
    photoPerson?: string;
    authorizedBy: string;
    timestamp: string;
    vehicle?: {
      type: string;
      plate: string;
      color: string;
      brand: string;
      model: string;
    };
  } | null;
}

export const VisitorDetailsModal: React.FC<VisitorDetailsModalProps> = ({
  isOpen,
  onClose,
  onDelete,
  onEdit,
  userRole,
  log
}) => {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  if (!isOpen || !log) return null;

  const isAdmin = userRole === 'Administrador';

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 animate-fade-in no-print">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg w-full space-y-4 shadow-2xl text-slate-100">
          
          {/* Header */}
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm uppercase tracking-wide text-blue-400">Ficha Detalhada do Acesso</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">✕</button>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            
            {/* Visitor metadata */}
            <div className="space-y-2">
              <p className="text-slate-500 uppercase font-bold text-[10px]">Informações do Visitante</p>
              <p className="text-sm font-bold text-white">{log.visitorName}</p>
              <p className="text-slate-400">Documento: <strong className="text-slate-300">{log.document}</strong></p>
              <p className="text-slate-400">Categoria: <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">{log.type}</span></p>
              <p className="text-slate-400">Autorizador: <strong className="text-slate-300">{log.authorizedBy}</strong></p>
              <p className="text-slate-400">Data/Hora Entrada: <strong className="text-slate-300">{log.timestamp}</strong></p>

              {log.vehicle && (
                <div className="pt-2 border-t border-slate-800 mt-2 space-y-1">
                  <p className="text-slate-500 uppercase font-bold text-[10px]">Veículo Cadastrado</p>
                  <p className="text-slate-300 font-bold text-amber-500">{log.vehicle.type}</p>
                  <p className="text-slate-400 font-mono">Placa: {log.vehicle.plate.toUpperCase()}</p>
                  <p className="text-slate-400">{log.vehicle.brand} {log.vehicle.model} ({log.vehicle.color})</p>
                </div>
              )}
            </div>

            {/* Photo preloading - Added click-to-zoom feature */}
            <div className="space-y-3">
              <p className="text-slate-500 uppercase font-bold text-[10px]">Imagens (Clique para ampliar)</p>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1 text-center">
                  <p className="text-[9px] text-slate-500 uppercase font-semibold">Documento</p>
                  <div 
                    onClick={() => log.photoDoc && setZoomedImage(log.photoDoc)}
                    className="w-full h-24 bg-slate-950 border border-slate-800 rounded-lg overflow-hidden flex items-center justify-center cursor-zoom-in hover:border-blue-500 transition-colors"
                  >
                    {log.photoDoc ? (
                      <img src={log.photoDoc} className="w-full h-full object-cover" alt="Document capture" />
                    ) : (
                      <span className="text-[10px] text-slate-600">Sem Foto</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1 text-center">
                  <p className="text-[9px] text-slate-500 uppercase font-semibold">Pessoa</p>
                  <div 
                    onClick={() => log.photoPerson && setZoomedImage(log.photoPerson)}
                    className="w-full h-24 bg-slate-950 border border-slate-800 rounded-lg overflow-hidden flex items-center justify-center cursor-zoom-in hover:border-blue-500 transition-colors"
                  >
                    {log.photoPerson ? (
                      <img src={log.photoPerson} className="w-full h-full object-cover" alt="Person capture" />
                    ) : (
                      <span className="text-[10px] text-slate-600">Sem Foto</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Footer actions with Print button integrated */}
          <div className="flex gap-2 pt-4 border-t border-slate-800">
            <button
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 py-2 rounded text-xs transition-colors"
            >
              Fechar Ficha
            </button>
            <button
              onClick={handlePrint}
              className="bg-indigo-900 hover:bg-indigo-800 text-white font-bold py-2 px-3 rounded text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <span>🖨️ Imprimir</span>
            </button>
            
            {isAdmin && (
              <>
                <button
                  onClick={() => onEdit(log.id)}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 py-2 rounded text-xs font-bold transition-colors"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => onDelete(log.id)}
                  className="flex-1 bg-red-700 hover:bg-red-600 py-2 rounded text-xs font-bold transition-colors"
                >
                  ❌ Excluir
                </button>
              </>
            )}
          </div>

        </div>
      </div>

      {/* LIGHTBOX ZOOM MODAL SCREEN */}
      {zoomedImage && (
        <div 
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4 cursor-zoom-out animate-fade-in"
        >
          <img src={zoomedImage} className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain border border-slate-800" alt="Zoomed Capture" />
          <span className="absolute bottom-6 text-xs text-slate-500 uppercase tracking-widest font-semibold">Clique em qualquer lugar para fechar</span>
        </div>
      )}
    </>
  );
};

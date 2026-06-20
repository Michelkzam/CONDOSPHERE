import React, { useState, useEffect } from 'react';

interface NegotiationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (installments: number, discountType: string, paymentMethod: string, finalValue: number) => void;
  debtorName: string;
  unitIdentifier: string;
  originalValue: number;
  penaltiesValue: number;
}

export const NegotiationModal: React.FC<NegotiationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  debtorName,
  unitIdentifier,
  originalValue,
  penaltiesValue
}) => {
  const [installments, setInstallments] = useState(3);
  const [discountType, setDiscountType] = useState('0'); // '0' = 0%, '50' = 50%, '100' = 100% waiver of penalties
  const [paymentMethod, setPaymentMethod] = useState('Pix');

  const totalPenalties = penaltiesValue;
  const penaltyWaiver = discountType === '100' ? totalPenalties : discountType === '50' ? totalPenalties * 0.5 : 0;
  const finalValue = originalValue + (totalPenalties - penaltyWaiver);
  const installmentValue = finalValue / installments;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl text-slate-100">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-amber-400">
            <span className="text-lg">🤝</span>
            <h3 className="font-bold text-sm uppercase tracking-wide">Acordo e Parcelamento Amigável</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">✕</button>
        </div>

        {/* Debtor details */}
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2 text-xs">
          <p className="text-slate-400"><strong className="text-slate-300">Responsável:</strong> {debtorName}</p>
          <p className="text-slate-400"><strong className="text-slate-300">Unidade:</strong> {unitIdentifier}</p>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-900 text-slate-400">
            <p>Valor Principal: <strong>R$ {originalValue.toFixed(2)}</strong></p>
            <p>Multas/Juros acumulados: <strong className="text-red-400">R$ {totalPenalties.toFixed(2)}</strong></p>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3">
          <div className="form-group">
            <label className="form-label text-slate-400">Desconto sobre Multas/Juros</label>
            <select
              value={discountType}
              onChange={e => setDiscountType(e.target.value)}
              className="w-full text-xs bg-slate-950 border border-slate-800 rounded p-2.5 text-slate-100 focus:outline-none"
            >
              <option value="0">Sem Desconto (0% de desconto)</option>
              <option value="50">Abatimento Parcial (50% de desconto nas multas)</option>
              <option value="100">Isenção Total (100% de perdão das multas/juros)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label text-slate-400">Parcelas</label>
              <select
                value={installments}
                onChange={e => setInstallments(Number(e.target.value))}
                className="w-full text-xs bg-slate-950 border border-slate-800 rounded p-2.5 text-slate-100 focus:outline-none"
              >
                <option value={1}>1x (À Vista)</option>
                <option value={2}>2x parcelas</option>
                <option value={3}>3x parcelas</option>
                <option value={6}>6x parcelas</option>
                <option value={12}>12x parcelas</option>
                <option value={24}>24x parcelas</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label text-slate-400">Método Pagamento</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full text-xs bg-slate-950 border border-slate-800 rounded p-2.5 text-slate-100 focus:outline-none"
              >
                <option value="Pix">Pix Híbrido</option>
                <option value="Boleto">Boleto Registrado</option>
                <option value="Cartão">Cartão de Crédito</option>
              </select>
            </div>
          </div>
        </div>

        {/* Calculation summary preview */}
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-center space-y-1">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Simulação do Acordo Aprovado</p>
          <p className="text-xl font-extrabold text-emerald-400">
            {installments}x de R$ {installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-400">
            Valor Consolidado: <strong className="text-white">R$ {finalValue.toFixed(2)}</strong> (Economia de R$ {penaltyWaiver.toFixed(2)})
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-800 hover:bg-slate-700 py-2 rounded text-xs transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(installments, discountType, paymentMethod, finalValue)}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded text-xs transition-colors"
          >
            Confirmar Acordo
          </button>
        </div>

      </div>
    </div>
  );
};

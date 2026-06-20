import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';

interface ReceivableUnit {
  id: any;
  identifier: string;
  owner: string;
  dueDate: string;
  delayDays: number;
  baseValue: number;
  extraCharges: number;
  agreedDiscounts?: number;
  status: 'Pendente' | 'Pago' | 'Vencido' | 'Acordo';
  chargeType?: string;
  paymentMethod?: string;
  paymentDate?: string;
  notes?: string;
  referenceMonth?: string;
  partialPayments?: { value: number; date: string; method: string }[];
  isWriteOff?: boolean;
  writeOffDate?: string;
  writeOffReason?: string;
}

interface AccountsReceivableProps {
  receivables: ReceivableUnit[];
  setReceivables: React.Dispatch<React.SetStateAction<ReceivableUnit[]>>;
  residents?: any[];
  residences?: any[];
}

export const AccountsReceivable: React.FC<AccountsReceivableProps> = ({ receivables, setReceivables, residents, residences }) => {
  const [subTab, setSubTab] = useState<'inadimplencia' | 'quitacao_acordos'>('inadimplencia');
  const [searchTerm, setSearchTerm] = useState('');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Anticipation states
  const [isAnticipateOpen, setIsAnticipateOpen] = useState(false);
  const [selectedAnticipateRec, setSelectedAnticipateRec] = useState<ReceivableUnit | null>(null);
  const [anticipateMonths, setMonthsToAnticipate] = useState(3);

  // Batch Settle states ("Quitar em Grupo")
  const [isBatchPayOpen, setIsBatchPayOpen] = useState(false);
  const [batchSearchTerm, setBatchSearchTerm] = useState('');
  const [selectedBatchIds, setSelectedBatchIds] = useState<any[]>([]);

  // Negotiation/Agreement state ("Acordo")
  const [isNegotiationOpen, setIsNegotiationOpen] = useState(false);
  const [selectedNegotiationRec, setSelectedNegotiationRec] = useState<ReceivableUnit | null>(null);
  const [negotiationInstallments, setNegotiationInstallments] = useState(3);

  // Boleto/PIX states
  const [isBoletoPixOpen, setIsBoletoPixOpen] = useState(false);
  const [selectedBoletoPixRec, setSelectedBoletoPixRec] = useState<ReceivableUnit | null>(null);
  const [boletoPixTab, setBoletoPixTab] = useState<'boleto' | 'pix'>('boleto');

  // Cancellation states
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelRec, setCancelRec] = useState<ReceivableUnit | null>(null);
  const [cancelType, setCancelType] = useState('cancelamento');
  const [cancelReason, setCancelReason] = useState('');
  const [cancelRefundMethod, setCancelRefundMethod] = useState('PIX');
  const [cancelRefundValue, setCancelRefundValue] = useState('');

  // Debit Entry states (Lançamento Avulso)
  const [isDebitEntryOpen, setIsDebitEntryOpen] = useState(false);
  const [debitEntryName, setDebitEntryName] = useState('');
  const [debitEntryIdentifier, setDebitEntryIdentifier] = useState('');
  const [debitEntryValue, setDebitEntryValue] = useState(0);
  const [debitEntryDueDate, setDebitEntryDueDate] = useState('');
  const [debitEntryExtra, setDebitEntryExtra] = useState(0);

  // Financial Config
  const [finConfig, setFinConfig] = useState({ fine_rate: 2, interest_rate: 1, discount_3m: 5, discount_6m: 10, discount_12m: 15, due_day: 10 });
  const [statusFilter, setStatusFilter] = useState<string>('Todos');

  // Payment modal states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentRecId, setPaymentRecId] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('Pix');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentValue, setPaymentValue] = useState(0);

  // Partial payment state
  const [isPartialOpen, setIsPartialOpen] = useState(false);
  const [partialRecId, setPartialRecId] = useState<any>(null);
  const [partialValue, setPartialValue] = useState(0);
  const [partialDate, setPartialDate] = useState(new Date().toISOString().split('T')[0]);
  const [partialMethod, setPartialMethod] = useState('Pix');

  // Write-off state
  const [isWriteOffOpen, setIsWriteOffOpen] = useState(false);
  const [writeOffRecId, setWriteOffRecId] = useState<any>(null);
  const [writeOffReason, setWriteOffReason] = useState('');

  // Edit state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editRec, setEditRec] = useState<ReceivableUnit | null>(null);
  const [editOwner, setEditOwner] = useState('');
  const [editIdentifier, setEditIdentifier] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editBaseValue, setEditBaseValue] = useState(0);
  const [editExtraCharges, setEditExtraCharges] = useState(0);
  const [editDiscounts, setEditDiscounts] = useState(0);
  const [editStatus, setEditStatus] = useState<string>('Pendente');

  // Fetch financial config on mount
  useEffect(() => {
    const saved = localStorage.getItem('condosphere_finconfig');
    if (saved) {
      try { setFinConfig(JSON.parse(saved)); } catch {}
    }
    supabase.from('financial_config').select('*').eq('id', 'main').single().then(({ data, error }) => {
      if (!error && data) {
        setFinConfig({ fine_rate: data.fine_rate, interest_rate: data.interest_rate, discount_3m: data.discount_3m, discount_6m: data.discount_6m, discount_12m: data.discount_12m, due_day: data.due_day });
        localStorage.setItem('condosphere_finconfig', JSON.stringify(data));
      }
    });
  }, []);

  // Auto-calculate delay_days for all receivables
  const receivablesWithDelay = useMemo(() => {
    const today = new Date();
    return receivables.map(r => {
      if (r.status === 'Pago' || r.status === 'Acordo') return { ...r, delayDays: 0 };
      const due = new Date(r.dueDate + 'T00:00:00');
      const diff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
      const delay = Math.max(0, diff);
      return { ...r, delayDays: delay };
    });
  }, [receivables]);

  // Calculations for KPI widgets using config rates
  const { fine_rate, interest_rate, discount_3m, discount_6m, discount_12m } = finConfig;
  const totalReceived = receivablesWithDelay.filter(r => r.status === 'Pago').reduce((acc, curr) => {
    const discount = curr.agreedDiscounts || 0;
    const partials = (curr.partialPayments || []).reduce((s, p) => s + p.value, 0);
    return acc + partials + curr.baseValue + curr.extraCharges - discount;
  }, 0);

  const totalToReceive = receivablesWithDelay.filter(r => r.status === 'Vencido' || r.status === 'Pendente').reduce((acc, curr) => {
    const penalty = curr.baseValue * (fine_rate / 100);
    const interest = curr.baseValue * ((interest_rate / 100) * (curr.delayDays / 30));
    const discount = curr.agreedDiscounts || 0;
    return acc + curr.baseValue + curr.extraCharges + penalty + interest - discount;
  }, 0);

  // Global search logic + sub-tab filter
  const filteredReceivables = receivablesWithDelay.filter(rec => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = rec.identifier.toLowerCase().includes(search) || rec.owner.toLowerCase().includes(search);
    const matchesStatus = statusFilter === 'Todos' || rec.status === statusFilter;
    const matchesSubTab = subTab === 'quitacao_acordos' ? rec.status === 'Acordo' : rec.status !== 'Acordo';
    return matchesSearch && matchesStatus && matchesSubTab;
  });

  // Payment modal
  const handleOpenPayment = (rec: ReceivableUnit) => {
    setPaymentRecId(rec.id);
    setPaymentValue(rec.baseValue + rec.extraCharges - (rec.agreedDiscounts || 0));
    setPaymentMethod('Pix');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setIsPaymentModalOpen(true);
  };

  const handleConfirmPayment = () => {
    if (!paymentRecId) return;
    const updated = receivables.map(r => r.id === paymentRecId ? { ...r, status: 'Pago' as const, delayDays: 0, paymentMethod, paymentDate } : r);
    setReceivables(updated);
    supabase.from('receivables').update({ status: 'Pago', payment_method: paymentMethod, payment_date: paymentDate }).eq('id', paymentRecId).then(({ error }) => {
      if (error) console.error("[SUPABASE ERROR] Payment sync failed:", error.message);
    });
    setIsPaymentModalOpen(false);
    setPaymentRecId(null);
  };

  // Partial payment
  const handleOpenPartialPayment = (rec: ReceivableUnit) => {
    setPartialRecId(rec.id);
    setPartialValue(0);
    setPartialDate(new Date().toISOString().split('T')[0]);
    setPartialMethod('Pix');
    setIsPartialOpen(true);
  };

  const handleConfirmPartial = () => {
    if (!partialRecId || !partialValue) return;
    const payment = { value: partialValue, date: partialDate, method: partialMethod };
    const updated = receivables.map(r => {
      if (r.id !== partialRecId) return r;
      const existing = r.partialPayments || [];
      const totalPaid = [...existing, payment].reduce((s, p) => s + p.value, 0);
      const totalDue = r.baseValue + r.extraCharges - (r.agreedDiscounts || 0);
      const newPartialPayments = [...existing, payment];
      return { ...r, partialPayments: newPartialPayments, status: (totalPaid >= totalDue ? 'Pago' : 'Vencido') as 'Pendente' | 'Pago' | 'Vencido' | 'Acordo', paymentMethod: partialMethod, paymentDate: partialDate };
    });
    setReceivables(updated);
    supabase.from('receivables').update({ status: 'Pago', payment_method: partialMethod, payment_date: partialDate }).eq('id', partialRecId).then(({ error }) => {
      if (error) console.error("[SUPABASE ERROR] Partial payment sync failed:", error.message);
    });
    setIsPartialOpen(false);
    setPartialRecId(null);
  };

  // Write-off
  const handleOpenWriteOff = (rec: ReceivableUnit) => {
    setWriteOffRecId(rec.id);
    setWriteOffReason('');
    setIsWriteOffOpen(true);
  };

  const handleConfirmWriteOff = () => {
    if (!writeOffRecId) return;
    const updated = receivables.map(r => r.id === writeOffRecId ? { ...r, status: 'Pago' as const, isWriteOff: true, writeOffDate: new Date().toISOString().split('T')[0], writeOffReason } : r);
    setReceivables(updated);
    supabase.from('receivables').update({ status: 'Pago', is_write_off: true, write_off_date: new Date().toISOString().split('T')[0], write_off_reason: writeOffReason }).eq('id', writeOffRecId).then(({ error }) => {
      if (error) console.error("[SUPABASE ERROR] Write-off sync failed:", error.message);
    });
    setIsWriteOffOpen(false);
    setWriteOffRecId(null);
  };

  // Cancellation / Refund
  const handleConfirmCancellation = async () => {
    if (!cancelRec || !cancelReason) return alert('Selecione o motivo do cancelamento.');
    const refundVal = cancelRefundValue ? parseFloat(cancelRefundValue) : cancelRec.baseValue + (cancelRec.extraCharges || 0);
    const payload = {
      receivable_id: cancelRec.id,
      original_value: cancelRec.baseValue + (cancelRec.extraCharges || 0),
      refund_value: cancelType === 'cancelamento' ? 0 : refundVal,
      cancellation_type: cancelType,
      reason: cancelReason,
      refund_method: cancelType !== 'cancelamento' ? cancelRefundMethod : null,
      original_payment_method: cancelRec.paymentMethod || null,
      original_payment_date: cancelRec.paymentDate || null,
      status: cancelType === 'cancelamento' ? 'Concluído' : 'Pendente'
    };
    const { error } = await supabase.from('payment_cancellations').insert([payload]);
    if (error) return alert('Erro: ' + error.message);
    if (cancelType === 'cancelamento') {
      const updated = receivables.map(r => r.id === cancelRec.id ? { ...r, status: 'Pendente' as const, paymentMethod: undefined, paymentDate: undefined } : r);
      setReceivables(updated);
      await supabase.from('receivables').update({ status: 'Pendente', payment_method: null, payment_date: null }).eq('id', cancelRec.id);
      alert('✅ Pagamento cancelado! Recebível revertido para Pendente.');
    } else {
      alert('📝 Solicitação de ' + (cancelType === 'estorno' ? 'estorno' : 'devolução') + ' registrada. Aguarde aprovação.');
    }
    setIsCancelOpen(false);
    setCancelRec(null);
  };

  // Monthly charge generation
  const handleGenerateMonthlyCharges = async () => {
    const now = new Date();
    const dueDay = finConfig.due_day;
    const nextDue = new Date(now.getFullYear(), now.getMonth() + 1, dueDay);
    const dueDateStr = nextDue.toISOString().split('T')[0];
    const refMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const activeResidences = residences?.filter((r: any) => r.status === 'Ativo' && r.owner && r.owner !== 'Sem Proprietário') || [];
    if (activeResidences.length === 0) {
      alert("Nenhuma residência ativa encontrada para gerar cobranças.");
      return;
    }

    let created = 0;
    const newRecs: ReceivableUnit[] = [];

    for (const res of activeResidences) {
      const alreadyExists = receivables.some(r => r.identifier === res.identifier && r.referenceMonth === refMonth && r.chargeType === 'Ordinária');
      if (alreadyExists) continue;
      newRecs.push({
        id: -Math.floor(Math.random() * 100000),
        identifier: res.identifier,
        owner: res.owner,
        dueDate: dueDateStr,
        delayDays: 0,
        baseValue: res.baseValue || 300,
        extraCharges: 0,
        chargeType: 'Ordinária',
        referenceMonth: refMonth,
        status: 'Pendente'
      });
      created++;
    }

    if (created === 0) {
      alert("Todas as cobranças do mês já foram geradas.");
      return;
    }

    setReceivables(prev => [...prev, ...newRecs]);

    const payloads = newRecs.map(r => ({
      identifier: r.identifier,
      owner_name: r.owner,
      due_date: dueDateStr,
      base_value: r.baseValue,
      extra_fees: 0,
      agreed_discounts: 0,
      charge_type: 'Ordinária',
      reference_month: refMonth,
      status: 'Pendente'
    }));
    supabase.from('receivables').insert(payloads).then(({ error }) => {
      if (error) console.error("[SUPABASE ERROR] Monthly charges insert failed:", error.message);
    });
    alert(`${created} cobranças geradas com sucesso para o mês ${refMonth}!`);
  };

  const handleOpenNegotiate = (rec: ReceivableUnit) => {
    setSelectedNegotiationRec(rec);
    setNegotiationInstallments(3);
    setIsNegotiationOpen(true);
  };

  const handleConfirmNegotiation = () => {
    if (!selectedNegotiationRec) return;
    
    const penalty = selectedNegotiationRec.baseValue * (finConfig.fine_rate / 100);
    const interest = selectedNegotiationRec.baseValue * ((finConfig.interest_rate / 100) * (selectedNegotiationRec.delayDays / 30));
    const totalPenalties = penalty + interest;
    const totalDue = selectedNegotiationRec.baseValue + selectedNegotiationRec.extraCharges + totalPenalties;
    const installmentValue = totalDue / negotiationInstallments;

    // Update receivable status to 'Pago' (or 'Acordo')
    const updated = receivables.map(r => r.id === selectedNegotiationRec.id ? { ...r, status: 'Pago' as const, delayDays: 0 } : r);
    setReceivables(updated);

    // Update Supabase
    supabase.from('receivables').update({ status: 'Acordo' }).eq('id', selectedNegotiationRec.id).then(({ error }) => {
      if (error) console.error("[SUPABASE ERROR] Agreement sync failed:", error.message);
    });

    // Gerar recibo de acordo
    const recData = [
      { label: 'Morador / Responsável:', value: selectedNegotiationRec.owner },
      { label: 'Unidade:', value: selectedNegotiationRec.identifier },
      { label: 'Valor Original:', value: `R$ ${selectedNegotiationRec.baseValue.toFixed(2)}` },
      { label: 'Multas e Juros:', value: `R$ ${totalPenalties.toFixed(2)}` },
      { label: 'Valor Total Consolidado:', value: `R$ ${totalDue.toFixed(2)}` },
      { label: 'Número de Parcelas:', value: `${negotiationInstallments}x` },
      { label: 'Valor de Cada Parcela:', value: `R$ ${installmentValue.toFixed(2)}` },
    ];

    downloadReceiptPDF('RECIBO DE ACORDO DE PARCELAMENTO', 'Acordo amigável homologado entre as partes', recData);

    setIsNegotiationOpen(false);
    setSelectedNegotiationRec(null);
    alert(`Acordo regimental de ${negotiationInstallments} parcelas homologado com sucesso!`);
  };

  const handleEdit = (rec: ReceivableUnit) => {
    setEditRec(rec);
    setEditOwner(rec.owner);
    setEditIdentifier(rec.identifier);
    setEditDueDate(rec.dueDate);
    setEditBaseValue(rec.baseValue);
    setEditExtraCharges(rec.extraCharges);
    setEditDiscounts(rec.agreedDiscounts || 0);
    setEditStatus(rec.status);
    setIsEditOpen(true);
  };

  const handleConfirmEdit = () => {
    if (!editRec) return;
    const updated = receivables.map(r => r.id === editRec.id ? {
      ...r, owner: editOwner, identifier: editIdentifier, dueDate: editDueDate,
      baseValue: editBaseValue, extraCharges: editExtraCharges, agreedDiscounts: editDiscounts, status: editStatus as any
    } : r);
    setReceivables(updated);
    supabase.from('receivables').update({
      owner_name: editOwner, identifier: editIdentifier, due_date: editDueDate,
      base_value: editBaseValue, extra_fees: editExtraCharges, agreed_discounts: editDiscounts, status: editStatus
    }).eq('id', editRec.id).then(({ error }) => {
      if (error) console.error("[SUPABASE ERROR] Edit update failed:", error.message);
    });
    setIsEditOpen(false);
    setEditRec(null);
  };

  const handleDelete = (id: any) => {
    if (confirm("Tem certeza que deseja excluir este lançamento de receita?")) {
      const updated = receivables.filter(r => r.id !== id);
      setReceivables(updated);

      // --- SUPABASE SYNC (DELETE) ---
      supabase.from('receivables').delete().eq('id', id).then(({ error }) => {
        if (error) console.error("[SUPABASE ERROR] Delete receivable failed:", error.message);
      });
    }
  };

  // Open anticipation modal
  const handleOpenAnticipate = (rec: ReceivableUnit) => {
    setSelectedAnticipateRec(rec);
    setMonthsToAnticipate(3);
    setIsAnticipateOpen(true);
  };

  // Calculate anticipation discount and values
  const getAnticipationCalculations = () => {
    if (!selectedAnticipateRec) return { unitValue: 0, subtotal: 0, discountPercent: 0, discountVal: 0, finalToPay: 0 };
    const months = anticipateMonths;
    const baseValue = selectedAnticipateRec.baseValue;

    let discountPercent = 0;
    if (months >= 12) discountPercent = finConfig.discount_12m;
    else if (months >= 6) discountPercent = finConfig.discount_6m;
    else if (months >= 3) discountPercent = finConfig.discount_3m;

    const subtotal = baseValue * months;
    const discountVal = (subtotal * discountPercent) / 100;
    const finalToPay = subtotal - discountVal;

    return {
      unitValue: baseValue,
      subtotal,
      discountPercent,
      discountVal,
      finalToPay
    };
  };

  // Confirm anticipation and push pre-paid future monthly installments
  const handleConfirmAnticipation = () => {
    if (!selectedAnticipateRec) return;
    const months = anticipateMonths;
    const baseValue = selectedAnticipateRec.baseValue;

    let discountPercent = 0;
    if (months >= 12) discountPercent = finConfig.discount_12m;
    else if (months >= 6) discountPercent = finConfig.discount_6m;
    else if (months >= 3) discountPercent = finConfig.discount_3m;

    const discountPerMonth = (baseValue * discountPercent) / 100;

    const [y, m, d] = selectedAnticipateRec.dueDate.split('-').map(Number);
    let baseDate = new Date(y, m - 1, d);

    const futureInstallments: ReceivableUnit[] = [];
    for (let i = 1; i <= months; i++) {
      const futureDate = new Date(baseDate);
      futureDate.setMonth(baseDate.getMonth() + i);
      
      const yyyy = futureDate.getFullYear();
      const mmStr = String(futureDate.getMonth() + 1).padStart(2, '0');
      const ddStr = String(futureDate.getDate()).padStart(2, '0');
      const futureDateStr = `${yyyy}-${mmStr}-${ddStr}`;

      futureInstallments.push({
        id: -Math.floor(Math.random() * 100000) - i, // Temp ID
        identifier: selectedAnticipateRec.identifier,
        owner: selectedAnticipateRec.owner,
        dueDate: futureDateStr,
        delayDays: 0,
        baseValue: baseValue,
        extraCharges: 0,
        agreedDiscounts: discountPerMonth,
        status: 'Pago' as const // Pre-paid instantly
      });
    }

    setReceivables(prev => [...prev, ...futureInstallments]);

    // --- SUPABASE SYNC (INSERT FUTURE INSTALLMENTS) ---
    const payloads = futureInstallments.map(fi => ({
      owner_name: fi.owner,
      due_date: fi.dueDate,
      base_value: fi.baseValue,
      extra_fees: fi.extraCharges,
      agreed_discounts: fi.agreedDiscounts || 0,
      status: 'Pago'
    }));

    supabase.from('receivables').insert(payloads).select().then(({ data, error }) => {
      if (error) {
        console.error("[SUPABASE ERROR] Bulk insert anticipated receivables failed:", error.message);
      } else if (data && data.length > 0) {
        // Re-load list to get proper UUIDs from Supabase
        supabase.from('receivables').select('*').then(({ data: freshData }) => {
          if (freshData) {
            setReceivables(freshData.map((rc: any) => ({
              id: rc.id,
              identifier: rc.identifier || "Mensalidade",
              owner: rc.owner_name,
              dueDate: rc.due_date,
              delayDays: rc.delay_days || 0,
              baseValue: Number(rc.base_value),
              extraCharges: Number(rc.extra_fees),
              agreedDiscounts: Number(rc.agreed_discounts),
              status: rc.status === 'Pago' ? 'Pago' : 'Vencido'
            })));
          }
        });
      }
    });

    // Gerar recibo de antecipação
    const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const receiptMonths = futureInstallments.map(fi => {
      const [y, m] = fi.dueDate.split('-').map(Number);
      return { month: `${monthNames[m - 1]}/${y}`, value: fi.baseValue };
    });

    const recData = [
      { label: 'Morador / Responsável:', value: selectedAnticipateRec.owner },
      { label: 'Unidade:', value: selectedAnticipateRec.identifier },
      { label: 'Valor Unitário:', value: `R$ ${calcs.unitValue.toFixed(2)}` },
      { label: 'Subtotal:', value: `R$ ${calcs.subtotal.toFixed(2)}` },
      { label: 'Desconto Aplicado:', value: `- R$ ${calcs.discountVal.toFixed(2)} (${calcs.discountPercent}%)` },
      { label: 'Total Pago:', value: `R$ ${calcs.finalToPay.toFixed(2)}` },
    ];

    downloadReceiptPDF('RECIBO DE ANTECIPAÇÃO DE PARCELAS', 'Parcelas quitadas antecipadamente com desconto', recData, receiptMonths);

    setIsAnticipateOpen(false);
    setSelectedAnticipateRec(null);
    alert(`Antecipação de ${months} mensalidades gerada e quitada com sucesso para ${selectedAnticipateRec.owner}!`);
  };

  // Handlers for Batch Settle ("Quitar em Grupo")
  const handleBatchCheckboxChange = (id: any) => {
    if (selectedBatchIds.includes(id)) {
      setSelectedBatchIds(prev => prev.filter(item => item !== id));
    } else {
      setSelectedBatchIds(prev => [...prev, id]);
    }
  };

  const handleConfirmBatchSettle = () => {
    if (selectedBatchIds.length === 0) {
      alert("Nenhum morador/mensalidade foi selecionado!");
      return;
    }

    const updated = receivables.map(r => 
      selectedBatchIds.includes(r.id) ? { ...r, status: 'Pago' as const, delayDays: 0 } : r
    );
    setReceivables(updated);

    // Sync with Supabase
    selectedBatchIds.forEach(id => {
      supabase.from('receivables').update({ status: 'Pago' }).eq('id', id).then(({ error }) => {
        if (error) console.error("[SUPABASE ERROR] Batch settle item failed:", error.message);
      });
    });

    alert(`${selectedBatchIds.length} mensalidades foram quitadas com sucesso!`);
    setIsBatchPayOpen(false);
    setSelectedBatchIds([]);
  };

  const calcs = getAnticipationCalculations();

  // Filter pending/unpaid monthly fees for batch settle list (Search by Resident Name or Unit Identifier)
  const pendingReceivablesForBatch = receivables.filter(r => 
    r.status !== 'Pago' && (
      r.owner.toLowerCase().includes(batchSearchTerm.toLowerCase()) ||
      r.identifier.toLowerCase().includes(batchSearchTerm.toLowerCase())
    )
  );

  // --- RECEIPT PDF UTILITY ---
  const downloadReceiptPDF = (title: string, subtitle: string, data: { label: string; value: string }[], months?: { month: string; value: number }[]) => {
    const systemName = "CondoSphere ERP";
    const currentDate = new Date().toLocaleDateString('pt-BR');
    const safeTitle = title.replace(/'/g, "\\'");
    const fileName = title.replace(/[^a-zA-Z0-9áéíóúãõçÀÉÍÓÚÂÊÔãõçÇ\s]/g, '').trim().replace(/\s+/g, '_');

    const monthsTable = months && months.length > 0 ? `
      <table style="width:100%; border-collapse: collapse; margin: 15px 0; font-size: 13px;">
        <thead>
          <tr style="background: #e0e0e0;">
            <th style="border: 1px solid #999; padding: 6px; text-align: left; font-size: 12px;">#</th>
            <th style="border: 1px solid #999; padding: 6px; text-align: left; font-size: 12px;">Mês de Referência</th>
            <th style="border: 1px solid #999; padding: 6px; text-align: right; font-size: 12px;">Valor</th>
          </tr>
        </thead>
        <tbody>
          ${months.map((m, i) => `
            <tr>
              <td style="border: 1px solid #999; padding: 6px; text-align: center;">${i + 1}</td>
              <td style="border: 1px solid #999; padding: 6px;">${m.month}</td>
              <td style="border: 1px solid #999; padding: 6px; text-align: right;">R$ ${m.value.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : '';

    const dataRows = data.map(d => `
      <tr>
        <td style="padding: 5px 10px; font-weight: bold; white-space: nowrap; vertical-align: top; width: 180px;">${d.label}</td>
        <td style="padding: 5px 10px; vertical-align: top;">${d.value}</td>
      </tr>
    `).join('');

    const receiptContent = (viaLabel: string) => `
      <div style="page-break-inside: avoid; padding: 30px 40px;">
        <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid #333; padding-bottom: 15px;">
          <h1 style="margin: 0; font-size: 22px; letter-spacing: 2px;">${systemName}</h1>
          <h2 style="margin: 8px 0; font-size: 16px; color: #333;">${title}</h2>
          <p style="font-size: 12px; color: #666; margin: 0;">${subtitle}</p>
        </div>
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="font-size: 14px; font-weight: bold; border: 2px solid #000; padding: 4px 25px; letter-spacing: 1px;">
            ${viaLabel}
          </span>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 5px;">
          ${dataRows}
        </table>
        ${monthsTable}
        <div style="margin-top: 35px; text-align: center;">
          <div style="border-top: 1px solid #333; width: 300px; margin: 0 auto; padding-top: 8px;">
            <span style="font-size: 12px; color: #555;">Assinatura do Administrador / Responsável</span>
          </div>
        </div>
        <p style="text-align: center; color: #999; font-size: 10px; margin-top: 25px;">
          Documento gerado eletronicamente em ${currentDate} pelo ${systemName}
        </p>
      </div>
    `;

    const pdfWindow = window.open('', '_blank');
    if (!pdfWindow) {
      alert("Por favor, permita pop-ups para baixar o recibo em PDF.");
      return;
    }

    pdfWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: 'Courier New', monospace; font-size: 13px; color: #000; margin: 0; padding: 0; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div id="receipt">
          ${receiptContent('1ª VIA - CONTROLADORIA')}
          <div style="border-top: 2px dashed #999; margin: 0 40px;"></div>
          ${receiptContent('2ª VIA - MORADOR / RESPONSÁVEL')}
        </div>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"><\/script>
        <script>
          setTimeout(function() {
            try {
              var opt = {
                margin: [10, 10, 10, 10],
                filename: '${safeTitle}.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, letterRendering: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
              };
              html2pdf().set(opt).from(document.getElementById('receipt')).save().then(function() {
                window.close();
              });
            } catch(e) {
              document.body.innerHTML = '<div style="padding:40px;text-align:center;font-family:sans-serif;"><h2>Erro ao gerar PDF</h2><p>' + e.message + '</p><button onclick="window.print()" style="padding:10px 20px;margin-top:20px;">Imprimir como PDF</button></div>';
            }
          }, 1500);
        <\/script>
      </body>
      </html>
    `);
    pdfWindow.document.close();
  };

  // --- PRINT / DOWNLOAD CHARGE DOCUMENT ---
  const buildChargeHTML = (rec: ReceivableUnit): string => {
    const sysName = 'CondoSphere ERP';
    const dt = new Date().toLocaleDateString('pt-BR');
    const penalty = rec.baseValue * (fine_rate / 100);
    const interest = rec.baseValue * ((interest_rate / 100) * (Math.max(0, rec.delayDays) / 30));
    const total = rec.baseValue + rec.extraCharges + penalty + interest - (rec.agreedDiscounts || 0);
    return `<!DOCTYPE html><html><head>
      <meta charset="UTF-8">
      <title>Cobrança - ${rec.identifier}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; font-size: 12px; color: #000; padding: 40px; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 25px; }
        .header h1 { font-size: 20px; letter-spacing: 2px; }
        .header h2 { font-size: 14px; color: #333; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        td { padding: 6px 10px; vertical-align: top; }
        td.label { font-weight: bold; width: 180px; white-space: nowrap; }
        .total { font-size: 15px; font-weight: bold; text-align: right; margin-top: 20px; padding: 10px; border-top: 2px solid #000; }
        .footer { text-align: center; color: #888; font-size: 10px; margin-top: 35px; padding-top: 10px; border-top: 1px solid #ccc; }
        .barcode { text-align: center; margin: 25px 0; font-family: monospace; letter-spacing: 3px; font-size: 18px; }
        @media print { body { padding: 20px; } }
      </style>
    </head><body>
      <div class="header">
        <h1>${sysName}</h1>
        <h2>📄 DOCUMENTO DE COBRANÇA</h2>
        <p style="font-size:11px;color:#666;margin-top:3px;">Emitido em ${dt}</p>
      </div>
      <table>
        <tr><td class="label">Morador:</td><td>${rec.owner}</td></tr>
        <tr><td class="label">Unidade:</td><td>${rec.identifier}</td></tr>
        <tr><td class="label">Data de Vencimento:</td><td>${new Date(rec.dueDate).toLocaleDateString('pt-BR')}</td></tr>
        <tr><td class="label">Status:</td><td>${rec.status}</td></tr>
        ${rec.chargeType ? `<tr><td class="label">Tipo de Cobrança:</td><td>${rec.chargeType}</td></tr>` : ''}
        ${rec.referenceMonth ? `<tr><td class="label">Mês de Referência:</td><td>${rec.referenceMonth}</td></tr>` : ''}
        <tr><td colspan="2" style="border-top:1px dashed #ccc;"></td></tr>
        <tr><td class="label">Valor Base:</td><td>R$ ${rec.baseValue.toFixed(2)}</td></tr>
        ${rec.extraCharges ? `<tr><td class="label">Acréscimos:</td><td>R$ ${rec.extraCharges.toFixed(2)}</td></tr>` : ''}
        ${rec.agreedDiscounts ? `<tr><td class="label">Descontos:</td><td>- R$ ${rec.agreedDiscounts.toFixed(2)}</td></tr>` : ''}
        <tr><td class="label">Multa (${fine_rate}%):</td><td>R$ ${penalty.toFixed(2)}</td></tr>
        <tr><td class="label">Juros (${interest_rate}% ao mês):</td><td>R$ ${interest.toFixed(2)}</td></tr>
      </table>
      <div class="total">VALOR TOTAL: R$ ${total.toFixed(2)}</div>
      ${rec.status === 'Pago' || rec.status === 'Acordo' ? `
      <div style="margin-top:20px;padding:10px;border:2px solid #2e7d32;text-align:center;">
        <span style="font-size:16px;font-weight:bold;color:#2e7d32;">✅ RECEBIDO</span>
        ${rec.paymentMethod ? `<p style="margin-top:5px;font-size:11px;">Forma: ${rec.paymentMethod} | Data: ${rec.paymentDate ? new Date(rec.paymentDate).toLocaleDateString('pt-BR') : '-'}</p>` : ''}
      </div>` : ''}
      <div class="footer">
        <p>Documento gerado eletronicamente em ${dt} pelo ${sysName}</p>
        <p style="margin-top:5px;">CondoSphere ERP - Sistema de Gestão Condominial</p>
      </div>
    </body></html>`;
  };

  const handlePrintCharge = (rec: ReceivableUnit) => {
    const w = window.open('', '_blank');
    if (!w) return alert('Permita pop-ups para imprimir.');
    w.document.write(buildChargeHTML(rec));
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 500);
  };

  const handleDownloadCharge = (rec: ReceivableUnit) => {
    const safeName = `Cobranca_${rec.identifier.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const w = window.open('', '_blank');
    if (!w) return alert('Permita pop-ups para baixar o PDF.');
    w.document.write(buildChargeHTML(rec));
    w.document.close();
    w.document.title = safeName;
    setTimeout(() => {
      const script = w.document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => {
        (w as any).html2pdf().set({ margin: [10, 10, 10, 10], filename: `${safeName}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true, letterRendering: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } }).from(w.document.body).save().then(() => w.close());
      };
      w.document.head.appendChild(script);
    }, 1000);
  };

  // --- DEBIT ENTRY HANDLER ---
  const handleConfirmDebitEntry = () => {
    if (!debitEntryName || !debitEntryValue || !debitEntryDueDate) {
      alert("Preencha todos os campos obrigatórios: Morador, Valor e Data de Vencimento.");
      return;
    }

    const newReceivable: ReceivableUnit = {
      id: -Math.floor(Math.random() * 100000),
      identifier: debitEntryIdentifier || "Lançamento Avulso",
      owner: debitEntryName,
      dueDate: debitEntryDueDate,
      delayDays: 0,
      baseValue: debitEntryValue,
      extraCharges: debitEntryExtra,
      agreedDiscounts: 0,
      status: 'Vencido'
    };

    setReceivables(prev => [...prev, newReceivable]);

    supabase.from('receivables').insert([{
      owner_name: debitEntryName,
      due_date: debitEntryDueDate,
      base_value: debitEntryValue,
      extra_fees: debitEntryExtra || 0,
      reservations_fees: 0,
      agreed_discounts: 0,
      status: 'Vencido'
    }]).then(({ error }) => {
      if (error) console.error("[SUPABASE ERROR] Debit entry failed:", error.message);
    });

    setIsDebitEntryOpen(false);
    setDebitEntryName('');
    setDebitEntryIdentifier('');
    setDebitEntryValue(0);
    setDebitEntryDueDate('');
    setDebitEntryExtra(0);
    alert(`Débito de R$ ${debitEntryValue.toFixed(2)} lançado com sucesso para ${debitEntryName}!`);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-6 text-slate-100">
      
      {/* Header with Export Report & Batch Pay Button */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-bold text-white uppercase">Contas a Receber</h2>
          <p className="text-xs text-slate-400">Arrecadação de mensalidades comunitárias e faturamento dinâmico</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGenerateMonthlyCharges}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded text-xs transition-colors flex items-center gap-1.5"
          >
            <span>📅 Gerar Cobranças do Mês</span>
          </button>
          <button
            onClick={() => setIsDebitEntryOpen(true)}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 px-4 rounded text-xs transition-colors flex items-center gap-1.5"
          >
            <span>➕ Lançamento Avulso</span>
          </button>
          <button
            onClick={() => setIsBatchPayOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded text-xs transition-colors flex items-center gap-1.5"
          >
            <span>🤝 Quitar em Grupo</span>
          </button>
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded text-xs transition-colors flex items-center gap-1"
          >
            📄 Exportar Relatório
          </button>
        </div>
      </div>

      {/* Sub-tabs: Inadimplência vs Quitação & Acordos */}
      <div className="flex border-b border-slate-800 pb-2 gap-4">
        <button
          onClick={() => setSubTab('inadimplencia')}
          className={`pb-2 text-xs font-bold uppercase transition-colors ${subTab === 'inadimplencia' ? 'border-b-2 border-blue-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}
        >
          📋 Controle de Inadimplência
        </button>
        <button
          onClick={() => setSubTab('quitacao_acordos')}
          className={`pb-2 text-xs font-bold uppercase transition-colors ${subTab === 'quitacao_acordos' ? 'border-b-2 border-blue-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}
        >
          🤝 Quitação & Acordos de Moradores
          {receivables.filter(r => r.status === 'Acordo').length > 0 && (
            <span className="ml-1.5 bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">
              {receivables.filter(r => r.status === 'Acordo').length}
            </span>
          )}
        </button>
      </div>

      {/* Metrics widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
          <p className="text-[10px] text-slate-400 font-semibold uppercase">Tudo que foi Recebido</p>
          <p className="text-xl font-bold text-emerald-400 mt-1">
            R$ {totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
          <p className="text-[10px] text-slate-400 font-semibold uppercase">Tudo que Falta Receber</p>
          <p className="text-xl font-bold text-red-400 mt-1">
            R$ {totalToReceive.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Global Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="form-group md:col-span-2">
          <label className="form-label">Busca Global (Quadra, Lote ou Morador)</label>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full text-xs bg-slate-950 border border-slate-800 rounded p-3 text-slate-100 focus:outline-none focus:border-blue-500"
            placeholder="Digite para filtrar instantaneamente..."
          />
        </div>
        <div className="form-group">
          <label className="form-label">Filtrar por Status</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full text-xs bg-slate-950 border border-slate-800 rounded p-3 text-slate-100 focus:outline-none focus:border-blue-500"
          >
            <option value="Todos">Todos os Status</option>
            <option value="Pendente">Pendente</option>
            <option value="Vencido">Vencido</option>
            <option value="Pago">Pago</option>
            <option value="Acordo">Acordo</option>
          </select>
        </div>
      </div>

      {/* Table grid listing units */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
            <tr>
              <th className="p-3"><span className="flex items-center gap-1">Unidade {filterIcon}</span></th>
              <th className="p-3"><span className="flex items-center gap-1">Proprietário {filterIcon}</span></th>
              <th className="p-3"><span className="flex items-center gap-1">Tipo {filterIcon}</span></th>
              <th className="p-3"><span className="flex items-center gap-1">Ref. {filterIcon}</span></th>
              <th className="p-3"><span className="flex items-center gap-1">Vencimento {filterIcon}</span></th>
              <th className="p-3"><span className="flex items-center gap-1">Atraso {filterIcon}</span></th>
              <th className="p-3"><span className="flex items-center gap-1">Valor Base {filterIcon}</span></th>
              <th className="p-3"><span className="flex items-center gap-1">Multas/Juros {filterIcon}</span></th>
              <th className="p-3"><span className="flex items-center gap-1">Total {filterIcon}</span></th>
              <th className="p-3"><span className="flex items-center gap-1">Status {filterIcon}</span></th>
              <th className="p-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredReceivables.map((rec) => {
              const penalty = rec.status === 'Vencido' ? rec.baseValue * (finConfig.fine_rate / 100) : 0;
              const interest = rec.status === 'Vencido' ? rec.baseValue * ((finConfig.interest_rate / 100) * (rec.delayDays / 30)) : 0;
              const discount = rec.agreedDiscounts || 0;
              const totalDue = rec.baseValue + rec.extraCharges + penalty + interest - discount;

              const dateParts = rec.dueDate.split('-');
              const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : rec.dueDate;

              // Check if resident has multiple unpaid installments (Inadimplente Recorrente)
              const unpaidCount = receivables.filter(r => r.owner === rec.owner && r.status === 'Vencido').length;
              const isRecurrentDefault = rec.status === 'Vencido' && unpaidCount > 1;

              const chargeTypeLabel = rec.chargeType === 'Mensalidade' ? '📋 Mensalidade' :
                rec.chargeType === 'Acordo' ? '📝 Acordo' :
                rec.chargeType === 'Avulso' ? '📌 Avulso' :
                rec.chargeType === 'Multa' ? '⚠️ Multa' :
                rec.chargeType === 'Juros' ? '📈 Juros' : '📋 Mensalidade';

              return (
                <tr key={rec.id} className={`hover:bg-slate-800/30 transition-colors ${rec.status === 'Vencido' ? 'bg-red-500/5' : ''}`}>
                  <td className="p-3 font-semibold text-white">{rec.identifier}</td>
                  <td className="p-3 text-slate-300">
                    <div className="flex flex-col">
                      <strong>{rec.owner}</strong>
                      {isRecurrentDefault && (
                        <span className="text-[9px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full mt-1 w-max animate-pulse">
                          ⚠️ Inadimplente Recorrente ({unpaidCount} parcelas)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded">{chargeTypeLabel}</span>
                  </td>
                  <td className="p-3 text-slate-400 text-[10px]">
                    {rec.referenceMonth || '-'}
                  </td>
                  <td className="p-3 font-medium text-blue-300 break-words max-w-[200px]">
                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                      {formattedDate}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-amber-500">
                    {rec.delayDays > 0 ? `${rec.delayDays} dias` : '-'}
                  </td>
                  <td className="p-3">
                    R$ {rec.baseValue.toFixed(2)}
                    {discount > 0 && (
                      <span className="block text-[10px] text-emerald-400 font-semibold">
                        (- R$ {discount.toFixed(2)})
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-amber-400">R$ {(penalty + interest).toFixed(2)}</td>
                  <td className="p-3 font-extrabold text-white">R$ {totalDue.toFixed(2)}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      rec.status === 'Pago' ? 'bg-emerald-500/10 text-emerald-400' : 
                      rec.status === 'Acordo' ? 'bg-amber-500/10 text-amber-400' :
                      rec.status === 'Vencido' ? 'bg-red-500/10 text-red-400' :
                      'bg-slate-500/10 text-slate-400'
                    }`}>
                      {rec.status || 'Pendente'}
                    </span>
                  </td>
                  
                  {/* Actions Column */}
                  <td className="p-3">
                    <div className="flex justify-center items-center gap-1.5">
                      {(rec.status === 'Vencido' || rec.status === 'Pendente') && (
                        <>
                          <button onClick={() => handlePrintCharge(rec)} className="p-1 text-slate-400 hover:text-white transition-colors" title="Visualizar/Imprimir Cobrança">
                            🖨️
                          </button>
                          <button onClick={() => handleDownloadCharge(rec)} className="p-1 text-slate-400 hover:text-white transition-colors" title="Baixar Documento de Cobrança">
                            ⬇️
                          </button>
                          <button onClick={() => handleOpenPayment(rec)} className="p-1 text-emerald-400 hover:text-emerald-300 transition-colors" title="Quitar">
                            💰
                          </button>
                          <button onClick={() => handleOpenPartialPayment(rec)} className="p-1 text-cyan-400 hover:text-cyan-300 transition-colors" title="Pagar Parcial">
                            🔹
                          </button>
                          <button onClick={() => handleOpenNegotiate(rec)} className="p-1 text-amber-500 hover:text-amber-400 transition-colors" title="Negociar (Acordo)">
                            🤝
                          </button>
                          <button onClick={() => { setSelectedBoletoPixRec(rec); setBoletoPixTab('boleto'); setIsBoletoPixOpen(true); }} className="p-1 text-purple-400 hover:text-purple-300 transition-colors" title="Gerar Boleto/PIX">
                            🏦
                          </button>
                        </>
                      )}
                      {rec.status === 'Acordo' && (
                        <>
                          <button onClick={() => handlePrintCharge(rec)} className="p-1 text-slate-400 hover:text-white transition-colors" title="Visualizar/Imprimir Cobrança">
                            🖨️
                          </button>
                          <button onClick={() => handleDownloadCharge(rec)} className="p-1 text-slate-400 hover:text-white transition-colors" title="Baixar Documento de Cobrança">
                            ⬇️
                          </button>
                          <button onClick={() => handleOpenPayment(rec)} className="p-1 text-emerald-400 hover:text-emerald-300 transition-colors" title="Quitar Acordo">
                            💰
                          </button>
                          <button onClick={() => handleOpenPartialPayment(rec)} className="p-1 text-cyan-400 hover:text-cyan-300 transition-colors" title="Pagar Parcial do Acordo">
                            🔹
                          </button>
                          <button onClick={() => { setSelectedBoletoPixRec(rec); setBoletoPixTab('boleto'); setIsBoletoPixOpen(true); }} className="p-1 text-purple-400 hover:text-purple-300 transition-colors" title="Gerar Boleto/PIX do Acordo">
                            🏦
                          </button>
                          <button onClick={() => { setCancelRec(rec); setCancelType('cancelamento'); setCancelReason(''); setCancelRefundMethod('PIX'); setCancelRefundValue(''); setIsCancelOpen(true); }} className="p-1 text-rose-400 hover:text-rose-300 transition-colors" title="Cancelar Acordo">
                            ↩️
                          </button>
                        </>
                      )}
                      {rec.status === 'Pago' && (
                        <>
                          <button onClick={() => handlePrintCharge(rec)} className="p-1 text-slate-400 hover:text-white transition-colors" title="Visualizar/Imprimir Cobrança">
                            🖨️
                          </button>
                          <button onClick={() => handleDownloadCharge(rec)} className="p-1 text-slate-400 hover:text-white transition-colors" title="Baixar Documento de Cobrança">
                            ⬇️
                          </button>
                          <button onClick={() => { setCancelRec(rec); setCancelType('cancelamento'); setCancelReason(''); setCancelRefundMethod('PIX'); setCancelRefundValue(''); setIsCancelOpen(true); }} className="p-1 text-rose-400 hover:text-rose-300 transition-colors" title="Cancelar/Estornar Pagamento">
                            🔄
                          </button>
                        </>
                      )}
                      <button onClick={() => handleOpenAnticipate(rec)} className="p-1 text-indigo-400 hover:text-indigo-300 transition-colors" title="Antecipar Parcelas">
                        📅
                      </button>
                      <button onClick={() => handleOpenWriteOff(rec)} className="p-1 text-red-400 hover:text-red-300 transition-colors" title="Baixar como Perda">
                        🚫
                      </button>
                      <button onClick={() => handleEdit(rec)} className="p-1 text-blue-400 hover:text-blue-300 transition-colors" title="Editar">
                        ✏️
                      </button>
                      <button onClick={() => handleDelete(rec.id)} className="p-1 text-red-400 hover:text-red-300 transition-colors" title="Excluir">
                        ❌
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredReceivables.length === 0 && (
              <tr>
                <td colSpan={11} className="p-4 text-center text-slate-500">Nenhum recebível cadastrado</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* DYNAMIC BATCH SETTLE MODAL ("Quitar em Grupo") */}
      {isBatchPayOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm uppercase text-emerald-400">🤝 Quitação em Grupo de Mensalidades</h3>
              <button onClick={() => setIsBatchPayOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Pesquisar Moradores em Atraso:</label>
                <input
                  type="text"
                  value={batchSearchTerm}
                  onChange={(e) => setBatchSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                  placeholder="Digite o nome do morador para filtrar..."
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 max-h-[180px] overflow-y-auto space-y-2">
                {pendingReceivablesForBatch.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">Nenhum morador em atraso localizado.</p>
                ) : (
                  pendingReceivablesForBatch.map((p) => (
                    <label key={p.id} className="flex items-center justify-between p-1.5 hover:bg-slate-900 rounded cursor-pointer text-slate-300">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedBatchIds.includes(p.id)}
                          onChange={() => handleBatchCheckboxChange(p.id)}
                          className="rounded bg-slate-900 border-slate-800 text-emerald-600 focus:ring-0"
                        />
                        <div className="flex flex-col">
                          <span className="font-bold text-white">{p.owner}</span>
                          <span className="text-[10px] text-slate-400">{p.identifier}</span>
                        </div>
                      </div>
                      <span className="font-mono text-emerald-400 font-bold">R$ {p.baseValue.toFixed(2)}</span>
                    </label>
                  ))
                )}
              </div>

              <div className="bg-slate-950 p-3 rounded border border-slate-800 flex justify-between font-bold text-slate-300">
                <span>Selecionados: {selectedBatchIds.length} moradores</span>
                <span className="text-emerald-400">
                  Total: R$ {receivables.filter(r => selectedBatchIds.includes(r.id)).reduce((s, curr) => s + curr.baseValue, 0).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsBatchPayOpen(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 rounded text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmBatchSettle}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 rounded text-xs transition-colors"
              >
                Confirmar Quitação em Lote
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DYNAMIC NEGOTIATION MODAL ("Acordo") */}
      {isNegotiationOpen && selectedNegotiationRec && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm uppercase text-amber-500">🤝 Homologar Acordo de Parcelamento</h3>
              <button onClick={() => setIsNegotiationOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <p className="text-slate-400 font-semibold">Morador / Responsável</p>
                <p className="text-sm font-bold text-white mt-0.5">{selectedNegotiationRec.owner}</p>
                <p className="text-[10px] text-blue-400 mt-0.5">{selectedNegotiationRec.identifier}</p>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Número de parcelas do acordo:</label>
                <select
                  value={negotiationInstallments}
                  onChange={(e) => setNegotiationInstallments(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-semibold"
                >
                  <option value={2}>2 Parcelas Mensais</option>
                  <option value={3}>3 Parcelas Mensais</option>
                  <option value={6}>6 Parcelas Mensais</option>
                  <option value={10}>10 Parcelas Mensais</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsNegotiationOpen(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 rounded text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmNegotiation}
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-semibold py-2 rounded text-xs transition-colors"
              >
                Confirmar Acordo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DYNAMIC ANTICIPATION MODAL */}
      {isAnticipateOpen && selectedAnticipateRec && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm uppercase">📅 Antecipar Parcelas</h3>
              <button onClick={() => setIsAnticipateOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <p className="text-slate-400 font-semibold">Morador / Responsável</p>
                <p className="text-sm font-bold text-white mt-0.5">{selectedAnticipateRec.owner}</p>
                <p className="text-[10px] text-blue-400 mt-0.5">{selectedAnticipateRec.identifier}</p>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Selecione o número de parcelas mensais à frente:</label>
                <select
                  value={anticipateMonths}
                  onChange={(e) => setMonthsToAnticipate(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-semibold"
                >
                  <option value={1}>1 Parcela (Sem Desconto)</option>
                  <option value={3}>3 Parcelas Mensais ({finConfig.discount_3m}% de Desconto)</option>
                  <option value={6}>6 Parcelas Mensais ({finConfig.discount_6m}% de Desconto)</option>
                  <option value={12}>12 Parcelas Mensais ({finConfig.discount_12m}% de Desconto - Anuidade)</option>
                </select>
              </div>

              <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Valor Unitário:</span>
                  <span className="text-white">R$ {calcs.unitValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Subtotal ({anticipateMonths}x):</span>
                  <span className="text-white">R$ {calcs.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>Desconto Aplicado:</span>
                  <span>- R$ {calcs.discountVal.toFixed(2)} ({calcs.discountPercent}%)</span>
                </div>
                <div className="border-t border-slate-800 pt-2 flex justify-between font-extrabold text-sm text-white">
                  <span>Total a Pagar:</span>
                  <span className="text-emerald-400">R$ {calcs.finalToPay.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAnticipateOpen(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 rounded text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmAnticipation}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded text-xs transition-colors"
              >
                Confirmar e Quitar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LANÇAMENTO AVULSO DE DÉBITO */}
      {isDebitEntryOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm uppercase text-amber-400">➕ Lançamento Avulso de Débito</h3>
              <button onClick={() => setIsDebitEntryOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3">
              <div className="form-group">
                <label className="form-label text-slate-400">Morador / Responsável *</label>
                <input
                  type="text"
                  value={debitEntryName}
                  onChange={e => setDebitEntryName(e.target.value)}
                  list="residents-list"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white focus:outline-none focus:border-amber-500"
                  placeholder="Digite o nome ou selecione da lista..."
                />
                <datalist id="residents-list">
                  {(residents || []).map((res: any) => (
                    <option key={res.id} value={res.name} />
                  ))}
                </datalist>
              </div>

              <div className="form-group">
                <label className="form-label text-slate-400">Descrição / Unidade</label>
                <input
                  type="text"
                  value={debitEntryIdentifier}
                  onChange={e => setDebitEntryIdentifier(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white focus:outline-none focus:border-amber-500"
                  placeholder="Ex: Taxa Extra, Multa, Reserva..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="form-label text-slate-400">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={debitEntryValue || ''}
                    onChange={e => setDebitEntryValue(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white focus:outline-none focus:border-amber-500"
                    placeholder="0,00"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label text-slate-400">Encargos (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={debitEntryExtra || ''}
                    onChange={e => setDebitEntryExtra(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white focus:outline-none focus:border-amber-500"
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label text-slate-400">Data de Vencimento *</label>
                <input
                  type="date"
                  value={debitEntryDueDate}
                  onChange={e => setDebitEntryDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsDebitEntryOpen(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 rounded text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDebitEntry}
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-semibold py-2 rounded text-xs transition-colors"
              >
                Lançar Débito
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PAGAMENTO COM MÉTODO E DATA */}
      {isPaymentModalOpen && paymentRecId && (() => {
        const payRec = receivables.find(r => r.id === paymentRecId);
        if (!payRec) return null;
        return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm uppercase text-emerald-400">💰 Quitar Mensalidade</h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-3">
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <p className="text-slate-400 font-semibold">Morador</p>
                <p className="text-sm font-bold text-white">{payRec.owner}</p>
                <p className="text-[10px] text-blue-400">{payRec.identifier}</p>
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Valor Total (R$)</label>
                <input type="text" value={`R$ ${paymentValue.toFixed(2)}`} disabled className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-bold" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Método de Pagamento</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white">
                  <option value="Pix">Pix</option>
                  <option value="Boleto">Boleto</option>
                  <option value="Cartão">Cartão de Crédito/Débito</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Depósito">Depósito/Transferência</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Data do Pagamento</label>
                <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" />
              </div>
            </div>
            <div className="flex gap-2 pt-3 border-t border-slate-800">
              <button onClick={() => setIsPaymentModalOpen(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 rounded text-xs">Cancelar</button>
              <button onClick={handleConfirmPayment} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 rounded text-xs">Confirmar Pagamento</button>
            </div>
          </div>
        </div>
      )})()}

      {/* MODAL DE PAGAMENTO PARCIAL */}
      {isPartialOpen && partialRecId && (() => {
        const payRec = receivables.find(r => r.id === partialRecId);
        if (!payRec) return null;
        return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm uppercase text-cyan-400">🔹 Pagamento Parcial</h3>
              <button onClick={() => setIsPartialOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-3">
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <p className="text-slate-400 font-semibold">Morador</p>
                <p className="text-sm font-bold text-white">{payRec.owner}</p>
                <p className="text-[10px] text-blue-400">{payRec.identifier}</p>
                <p className="text-xs text-amber-400 mt-1">Total: R$ {(payRec.baseValue + payRec.extraCharges).toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Valor a Pagar (R$) *</label>
                <input type="number" step="0.01" min="0.01" value={partialValue || ''} onChange={e => setPartialValue(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" placeholder="0,00" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Data do Pagamento</label>
                <input type="date" value={partialDate} onChange={e => setPartialDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Método de Pagamento</label>
                <select value={partialMethod} onChange={e => setPartialMethod(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white">
                  <option value="Pix">Pix</option>
                  <option value="Boleto">Boleto</option>
                  <option value="Cartão">Cartão de Crédito/Débito</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Depósito">Depósito/Transferência</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-3 border-t border-slate-800">
              <button onClick={() => setIsPartialOpen(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 rounded text-xs">Cancelar</button>
              <button onClick={handleConfirmPartial} className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 rounded text-xs">Confirmar Pagamento Parcial</button>
            </div>
          </div>
        </div>
      )})()}

      {/* MODAL DE BAIXA COMO PERDA (WRITE-OFF) */}
      {isWriteOffOpen && writeOffRecId && (() => {
        const payRec = receivables.find(r => r.id === writeOffRecId);
        if (!payRec) return null;
        return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm uppercase text-red-400">🚫 Baixar como Perda</h3>
              <button onClick={() => setIsWriteOffOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-3">
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <p className="text-slate-400 font-semibold">Morador</p>
                <p className="text-sm font-bold text-white">{payRec.owner}</p>
                <p className="text-[10px] text-blue-400">{payRec.identifier}</p>
                <p className="text-xs text-red-400 mt-1">Valor: R$ {(payRec.baseValue + payRec.extraCharges).toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Motivo da Baixa *</label>
                <select value={writeOffReason} onChange={e => setWriteOffReason(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white">
                  <option value="">Selecione um motivo...</option>
                  <option value="Inadimplência">Inadimplência (não recuperável)</option>
                  <option value="Desistência">Morador desistiu / saiu</option>
                  <option value="Erro de lançamento">Erro de lançamento</option>
                  <option value="Acordo judicial">Acordo judicial</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
              {writeOffReason === 'Outro' && (
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Descrição</label>
                  <input type="text" value={writeOffReason} onChange={e => setWriteOffReason(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" placeholder="Descreva o motivo..." />
                </div>
              )}
            </div>
            <div className="flex gap-2 pt-3 border-t border-slate-800">
              <button onClick={() => setIsWriteOffOpen(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 rounded text-xs">Cancelar</button>
              <button onClick={handleConfirmWriteOff} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-2 rounded text-xs">Confirmar Baixa</button>
            </div>
          </div>
        </div>
      )})()}

      {/* MODAL SIMULATION FOR EXPORTING REPORT */}
      {/* EDIT MODAL */}
      {isEditOpen && editRec && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg w-full space-y-3 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm uppercase">✏️ Editar Cobrança</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group col-span-2">
                <label className="form-label">Morador</label>
                <input type="text" value={editOwner} onChange={e => setEditOwner(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" />
              </div>
              <div className="form-group col-span-2">
                <label className="form-label">Unidade</label>
                <input type="text" value={editIdentifier} onChange={e => setEditIdentifier(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" />
              </div>
              <div className="form-group">
                <label className="form-label">Vencimento</label>
                <input type="date" value={editDueDate} onChange={e => setEditDueDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select value={editStatus} onChange={e => setEditStatus(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white">
                  <option value="Pendente">Pendente</option><option value="Pago">Pago</option>
                  <option value="Vencido">Vencido</option><option value="Acordo">Acordo</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Valor Base</label>
                <input type="number" step="0.01" value={editBaseValue} onChange={e => setEditBaseValue(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" />
              </div>
              <div className="form-group">
                <label className="form-label">Acréscimos</label>
                <input type="number" step="0.01" value={editExtraCharges} onChange={e => setEditExtraCharges(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" />
              </div>
              <div className="form-group col-span-2">
                <label className="form-label">Descontos</label>
                <input type="number" step="0.01" value={editDiscounts} onChange={e => setEditDiscounts(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" />
              </div>
            </div>
            <div className="flex gap-2 pt-3 border-t border-slate-800">
              <button onClick={() => setIsEditOpen(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 rounded text-xs">Cancelar</button>
              <button onClick={handleConfirmEdit} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded text-xs">Salvar Alterações</button>
            </div>
          </div>
        </div>
      )}

      {/* CANCELAMENTO / ESTORNO MODAL */}
      {isCancelOpen && cancelRec && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg w-full space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm uppercase">🔄 Cancelar / Estornar Pagamento</h3>
              <button onClick={() => setIsCancelOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="text-slate-400 space-y-1">
              <p><span className="font-bold text-white">Morador:</span> {cancelRec.owner}</p>
              <p><span className="font-bold text-white">Unidade:</span> {cancelRec.identifier}</p>
              <p><span className="font-bold text-white">Valor Pago:</span> R$ {(cancelRec.baseValue + (cancelRec.extraCharges || 0)).toFixed(2)}</p>
              <p><span className="font-bold text-white">Pagamento:</span> {cancelRec.paymentMethod || '-'} em {cancelRec.paymentDate ? new Date(cancelRec.paymentDate).toLocaleDateString('pt-BR') : '-'}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="form-label">Tipo *</label>
                <select value={cancelType} onChange={e => setCancelType(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white">
                  <option value="cancelamento">Cancelamento (reverte para Pendente)</option>
                  <option value="estorno">Estorno (devolve valor)</option>
                  <option value="devolucao">Devolução (transferência bancária)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Motivo *</label>
                <input type="text" value={cancelReason} onChange={e => setCancelReason(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" placeholder="Ex: Pagamento indevido" />
              </div>
            </div>
            {cancelType !== 'cancelamento' && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-amber-950/20 rounded-lg border border-amber-800/30">
                <p className="text-[9px] text-amber-400 col-span-2 font-bold uppercase">Dados da Devolução</p>
                <div className="form-group">
                  <label className="form-label">Método *</label>
                  <select value={cancelRefundMethod} onChange={e => setCancelRefundMethod(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white">
                    <option value="PIX">PIX</option><option value="TED">TED</option><option value="Boleto">Boleto</option>
                    <option value="Dinheiro">Dinheiro</option><option value="Crédito em Conta">Crédito em Conta</option><option value="Depósito">Depósito</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Valor *</label>
                  <input type="number" step="0.01" value={cancelRefundValue} onChange={e => setCancelRefundValue(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" placeholder="R$ {(cancelRec.baseValue + (cancelRec.extraCharges || 0)).toFixed(2)}" />
                </div>
              </div>
            )}
            {cancelType === 'cancelamento' && (
              <div className="bg-blue-950/30 text-blue-400 text-[10px] p-3 rounded border border-blue-800/30">
                ⚡ O recebível será revertido para <strong>Pendente</strong> imediatamente.
              </div>
            )}
            <div className="flex gap-2 pt-3 border-t border-slate-800">
              <button onClick={() => setIsCancelOpen(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 rounded text-xs">Cancelar</button>
              <button onClick={handleConfirmCancellation} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded text-xs">
                {cancelType === 'cancelamento' ? 'Confirmar Cancelamento' : 'Solicitar ' + (cancelType === 'estorno' ? 'Estorno' : 'Devolução')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOLETO / PIX GENERATION MODAL */}
      {isBoletoPixOpen && selectedBoletoPixRec && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg w-full space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm uppercase">🏦 Gerar Cobrança</h3>
              <button onClick={() => setIsBoletoPixOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="text-xs text-slate-400 space-y-1">
              <p><span className="font-bold text-white">Morador:</span> {selectedBoletoPixRec.owner}</p>
              <p><span className="font-bold text-white">Unidade:</span> {selectedBoletoPixRec.identifier}</p>
              <p><span className="font-bold text-white">Valor:</span> R$ {(selectedBoletoPixRec.baseValue + (selectedBoletoPixRec.extraCharges || 0)).toFixed(2)}</p>
              <p><span className="font-bold text-white">Vencimento:</span> {new Date(selectedBoletoPixRec.dueDate).toLocaleDateString('pt-BR')}</p>
            </div>
            <div className="flex gap-2 bg-slate-950 rounded-lg p-1 border border-slate-800">
              <button onClick={() => setBoletoPixTab('boleto')} className={`flex-1 py-2 rounded-md text-xs font-bold uppercase tracking-wider ${boletoPixTab === 'boleto' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>📄 Boleto</button>
              <button onClick={() => setBoletoPixTab('pix')} className={`flex-1 py-2 rounded-md text-xs font-bold uppercase tracking-wider ${boletoPixTab === 'pix' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>💳 PIX</button>
            </div>
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-center space-y-3">
              {boletoPixTab === 'boleto' ? (
                <>
                  <div className="w-48 h-48 mx-auto bg-white rounded flex items-center justify-center text-slate-800 text-[9px] font-mono">
                    [Código de Barras — {selectedBoletoPixRec.id}]
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Linha Digitável</p>
                    <p className="text-xs font-mono text-blue-400 bg-slate-900 p-2 rounded border border-slate-800 select-all break-all">
                      34191.09012 61234.567890 12345.678901 1 12345678901234
                    </p>
                    <button onClick={() => { navigator.clipboard.writeText('34191.09012 61234.567890 12345.678901 1 12345678901234'); alert('Código de barras copiado!'); }} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-1.5 rounded text-[10px] uppercase">
                      📋 Copiar Código
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="w-48 h-48 mx-auto bg-white rounded flex items-center justify-center text-slate-800 text-[9px] font-mono">
                    [QR Code PIX — {selectedBoletoPixRec.id}]
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">PIX Copia e Cola</p>
                    <p className="text-[10px] font-mono text-green-400 bg-slate-900 p-2 rounded border border-slate-800 select-all break-all">
                      00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266141740005204000053039865802BR5913Condosphere Cond6009Sao Paulo62070503***6304ABCD
                    </p>
                    <button onClick={() => { navigator.clipboard.writeText('00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266141740005204000053039865802BR5913Condosphere Cond6009Sao Paulo62070503***6304ABCD'); alert('PIX Copia e Cola copiado!'); }} className="bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-1.5 rounded text-[10px] uppercase">
                      📋 Copiar PIX
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-center gap-2">
              <button onClick={() => { alert(`📧 Boleto enviado para ${selectedBoletoPixRec.owner}`); }} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded text-xs">📧 Enviar por Email</button>
              <button onClick={() => { alert(`📱 Link de pagamento compartilhado via WhatsApp`); }} className="bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 rounded text-xs">📱 Compartilhar</button>
            </div>
          </div>
        </div>
      )}

      {isReportModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm uppercase">Exportar Relatório Financeiro</h3>
              <button onClick={() => setIsReportModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <p className="text-xs text-slate-300">
              Deseja exportar a lista unificada de contas a receber e inadimplências atuais para planilha?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 rounded text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setIsReportModalOpen(false);
                  alert("Relatório de Recebíveis e Inadimplências exportado com sucesso em .xlsx!");
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded text-xs transition-colors"
              >
                Confirmar Exportação
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default AccountsReceivable;

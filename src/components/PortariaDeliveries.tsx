import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Delivery {
  id: any;
  resident_name: string;
  unit_identifier: string;
  carrier: string;
  tracking_code: string;
  description: string;
  received_by: string;
  received_at: string;
  delivery_status: string;
  notified: boolean;
  pickup_code: string;
  created_at: string;
}

export const PortariaDeliveries: React.FC = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formResident, setFormResident] = useState('');
  const [formUnit, setFormUnit] = useState('');
  const [formCarrier, setFormCarrier] = useState('');
  const [formTracking, setFormTracking] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const [stats, setStats] = useState({ aguardando: 0, retirado: 0, today: 0 });

  useEffect(() => {
    loadDeliveries();
  }, []);

  const loadDeliveries = async () => {
    const { data } = await supabase.from('deliveries').select('*').order('created_at', { ascending: false });
    if (data) {
      setDeliveries(data as Delivery[]);
      const today = new Date().toISOString().split('T')[0];
      setStats({
        aguardando: data.filter((d: any) => d.delivery_status === 'Aguardando').length,
        retirado: data.filter((d: any) => d.delivery_status === 'Retirado').length,
        today: data.filter((d: any) => d.created_at?.startsWith(today)).length
      });
    }
  };

  const generatePickupCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  const handleRegisterDelivery = async () => {
    if (!formResident || !formCarrier || !formDescription) return alert('Preencha morador, transportadora e descrição.');
    const code = generatePickupCode();
    const payload = {
      resident_name: formResident,
      unit_identifier: formUnit,
      carrier: formCarrier,
      tracking_code: formTracking,
      description: formDescription,
      delivery_status: 'Aguardando',
      pickup_code: code,
      notified: false
    };
    const { error } = await supabase.from('deliveries').insert([payload]);
    if (error) return alert('Erro: ' + error.message);
    setShowForm(false);
    setFormResident(''); setFormUnit(''); setFormCarrier(''); setFormTracking(''); setFormDescription('');
    loadDeliveries();
    alert(`📦 Encomenda registrada! Código de retirada: ${code}`);
  };

  const handlePickup = async (d: Delivery) => {
    await supabase.from('deliveries').update({
      delivery_status: 'Retirado',
      received_by: '',
      received_at: new Date().toISOString()
    }).eq('id', d.id);
    loadDeliveries();
  };

  const handleNotify = async (d: Delivery) => {
    if (d.notified) return;
    // Try to send via API, fallback to marking as notified
    try {
      const residentContact = d.unit_identifier;
      await supabase.from('notification_queue').insert([{
        template_id: null,
        recipient: residentContact,
        channel: 'whatsapp',
        variables_json: JSON.stringify({
          residente: d.resident_name,
          transportadora: d.carrier,
          codigo: d.pickup_code
        }),
        status: 'pending'
      }]);
    } catch (e) {}
    await supabase.from('deliveries').update({ notified: true }).eq('id', d.id);
    loadDeliveries();
  };

  const filtered = deliveries.filter(d => {
    const matchSearch = d.resident_name.toLowerCase().includes(search.toLowerCase()) || d.unit_identifier.toLowerCase().includes(search.toLowerCase()) || d.carrier.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'Todos' || d.delivery_status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4">
      {/* Header + Stats */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-white uppercase">📦 Controle de Encomendas</h2>
        <button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded text-xs">+ Nova Encomenda</button>
      </div>
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-center"><p className="text-2xl font-bold text-white">{deliveries.length}</p><p className="text-[10px] text-slate-400 uppercase font-bold">Total</p></div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-center"><p className="text-2xl font-bold text-yellow-400">{stats.aguardando}</p><p className="text-[10px] text-slate-400 uppercase font-bold">Aguardando</p></div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-center"><p className="text-2xl font-bold text-green-400">{stats.retirado}</p><p className="text-[10px] text-slate-400 uppercase font-bold">Retirados</p></div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-center"><p className="text-2xl font-bold text-blue-400">{stats.today}</p><p className="text-[10px] text-slate-400 uppercase font-bold">Hoje</p></div>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-2">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="flex-1 bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white" placeholder="Buscar por morador, unidade ou transportadora..." />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white">
          <option value="Todos">Todos</option>
          <option value="Aguardando">Aguardando</option>
          <option value="Retirado">Retirado</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-slate-300">
          <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider">
            <tr>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Morador</th>
              <th className="p-3 text-left">Unidade</th>
              <th className="p-3 text-left">Transportadora</th>
              <th className="p-3 text-left">Descrição</th>
              <th className="p-3 text-left">Código</th>
              <th className="p-3 text-left">Recebido em</th>
              <th className="p-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filtered.map(d => (
              <tr key={d.id} className="hover:bg-slate-800/30">
                <td className="p-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${d.delivery_status === 'Aguardando' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-green-500/10 text-green-400'}`}>
                    {d.delivery_status}
                  </span>
                </td>
                <td className="p-3 font-bold text-white">{d.resident_name}</td>
                <td className="p-3 text-slate-400">{d.unit_identifier}</td>
                <td className="p-3">{d.carrier}</td>
                <td className="p-3 text-slate-400 max-w-[200px] truncate">{d.description}</td>
                <td className="p-3 font-mono text-blue-400 font-bold">{d.pickup_code}</td>
                <td className="p-3 text-slate-500">{d.received_at ? new Date(d.received_at).toLocaleString('pt-BR') : '-'}</td>
                <td className="p-3">
                  <div className="flex justify-center gap-1">
                    {d.delivery_status === 'Aguardando' && (
                      <>
                        <button onClick={() => handlePickup(d)} className="bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded text-[9px] font-bold">Retirar</button>
                        <button onClick={() => handleNotify(d)} className={`px-2 py-1 rounded text-[9px] font-bold ${d.notified ? 'bg-slate-700 text-slate-400' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>
                          {d.notified ? '✅ Notificado' : '📲 Notificar'}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="text-center p-4 text-slate-500">Nenhuma encomenda registrada</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* New Delivery Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm uppercase">📦 Nova Encomenda</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group col-span-2"><label className="form-label">Morador *</label><input type="text" value={formResident} onChange={e => setFormResident(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" /></div>
              <div className="form-group"><label className="form-label">Unidade</label><input type="text" value={formUnit} onChange={e => setFormUnit(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" /></div>
              <div className="form-group"><label className="form-label">Transportadora *</label><input type="text" value={formCarrier} onChange={e => setFormCarrier(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" /></div>
              <div className="form-group"><label className="form-label">Cód. Rastreio</label><input type="text" value={formTracking} onChange={e => setFormTracking(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" /></div>
              <div className="form-group col-span-2"><label className="form-label">Descrição *</label><input type="text" value={formDescription} onChange={e => setFormDescription(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" /></div>
            </div>
            <div className="flex gap-2 pt-3 border-t border-slate-800">
              <button onClick={() => setShowForm(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 rounded text-xs">Cancelar</button>
              <button onClick={handleRegisterDelivery} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded text-xs">Registrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortariaDeliveries;

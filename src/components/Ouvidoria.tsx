import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Ticket {
  id: any;
  unit_identifier: string;
  resident_name: string;
  contact: string;
  category: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  assigned_to: string;
  created_at: string;
  updated_at: string;
  closed_at: string;
}

interface TicketMessage {
  id: any;
  ticket_id: any;
  author: string;
  message: string;
  is_internal: boolean;
  created_at: string;
}

const CATEGORIES = ['Reclamação', 'Sugestão', 'Solicitação', 'Manutenção', 'Barulho', 'Vaga de Garagem', 'Área Comum', 'Cobrança', 'Outros'];
const PRIORITIES = ['Baixa', 'Media', 'Alta', 'Urgente'];
const STATUSES = ['Aberto', 'Em Andamento', 'Aguardando Resposta', 'Resolvido', 'Fechado'];

export const Ouvidoria: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');

  // New ticket form
  const [formName, setFormName] = useState('');
  const [formUnit, setFormUnit] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formCategory, setFormCategory] = useState('Solicitação');
  const [formSubject, setFormSubject] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState('Media');

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    const { data } = await supabase.from('ouvidoria_tickets').select('*').order('created_at', { ascending: false });
    if (data) setTickets(data as Ticket[]);
  };

  const loadMessages = async (ticketId: any) => {
    const { data } = await supabase.from('ouvidoria_messages').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true });
    if (data) setMessages(data as TicketMessage[]);
  };

  const openTicket = (t: Ticket) => {
    setSelectedTicket(t);
    loadMessages(t.id);
  };

  const handleCreateTicket = async () => {
    if (!formName || !formSubject || !formDescription) return alert('Preencha nome, assunto e descrição.');
    const payload = {
      unit_identifier: formUnit,
      resident_name: formName,
      contact: formContact,
      category: formCategory,
      subject: formSubject,
      description: formDescription,
      priority: formPriority,
      status: 'Aberto'
    };
    const { data, error } = await supabase.from('ouvidoria_tickets').insert([payload]).select();
    if (error) return alert('Erro: ' + error.message);
    setShowForm(false);
    resetForm();
    loadTickets();
    if (data && data[0]) alert('Chamado #' + data[0].id.slice(0, 8) + ' aberto com sucesso!');
  };

  const handleSendMessage = async () => {
    if (!selectedTicket || !newMessage.trim()) return;
    const payload = {
      ticket_id: selectedTicket.id,
      author: 'Administrador',
      message: newMessage.trim(),
      is_internal: isInternal
    };
    const { error } = await supabase.from('ouvidoria_messages').insert([payload]);
    if (error) return alert('Erro: ' + error.message);
    setNewMessage('');
    loadMessages(selectedTicket.id);
    // Re-open ticket if it was closed
    if (selectedTicket.status === 'Fechado' || selectedTicket.status === 'Resolvido') {
      await supabase.from('ouvidoria_tickets').update({ status: 'Em Andamento', updated_at: new Date().toISOString() }).eq('id', selectedTicket.id);
      loadTickets();
      setSelectedTicket({ ...selectedTicket, status: 'Em Andamento' });
    }
  };

  const updateStatus = async (ticketId: any, newStatus: string) => {
    await supabase.from('ouvidoria_tickets').update({
      status: newStatus,
      updated_at: new Date().toISOString(),
      closed_at: newStatus === 'Fechado' ? new Date().toISOString() : null
    }).eq('id', ticketId);
    loadTickets();
    if (selectedTicket?.id === ticketId) setSelectedTicket({ ...selectedTicket, status: newStatus });
  };

  const resetForm = () => {
    setFormName(''); setFormUnit(''); setFormContact(''); setFormCategory('Solicitação');
    setFormSubject(''); setFormDescription(''); setFormPriority('Media');
  };

  const priorityColor = (p: string) =>
    p === 'Urgente' ? 'text-red-400' : p === 'Alta' ? 'text-orange-400' : p === 'Media' ? 'text-yellow-400' : 'text-slate-400';
  const statusColor = (s: string) =>
    s === 'Aberto' ? 'bg-blue-500/10 text-blue-400' :
    s === 'Em Andamento' ? 'bg-amber-500/10 text-amber-400' :
    s === 'Aguardando Resposta' ? 'bg-purple-500/10 text-purple-400' :
    s === 'Resolvido' ? 'bg-green-500/10 text-green-400' : 'bg-slate-500/10 text-slate-400';

  const filtered = tickets.filter(t => {
    const matchSearch = t.subject.toLowerCase().includes(search.toLowerCase()) || t.resident_name.toLowerCase().includes(search.toLowerCase()) || t.unit_identifier.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'Todos' || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Left panel: Ticket list */}
      <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-white text-sm uppercase">📋 Chamados</h2>
          <button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded text-xs">+ Novo</button>
        </div>
        <div className="flex gap-1">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="flex-1 bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white" placeholder="Buscar..." />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white">
            <option value="Todos">Todos</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="space-y-2 max-h-[70vh] overflow-y-auto">
          {filtered.map(t => (
            <div key={t.id} onClick={() => openTicket(t)} className={`p-3 rounded-lg cursor-pointer border transition-colors ${selectedTicket?.id === t.id ? 'border-blue-500 bg-slate-800' : 'border-slate-800 hover:bg-slate-800/50'}`}>
              <div className="flex justify-between items-start">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${statusColor(t.status)}`}>{t.status}</span>
                <span className={`text-[10px] font-bold ${priorityColor(t.priority)}`}>{t.priority}</span>
              </div>
              <p className="text-xs font-bold text-white mt-1 truncate">{t.subject}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{t.resident_name} • {t.unit_identifier}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{new Date(t.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-xs text-slate-500 text-center py-4">Nenhum chamado encontrado</p>}
        </div>
      </div>

      {/* Right panel: Ticket detail or new form */}
      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4">
        {showForm ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm uppercase">📝 Novo Chamado</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white text-xs">✕ Voltar</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group"><label className="form-label">Nome do Morador *</label><input type="text" value={formName} onChange={e => setFormName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white" /></div>
              <div className="form-group"><label className="form-label">Unidade</label><input type="text" value={formUnit} onChange={e => setFormUnit(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white" /></div>
              <div className="form-group"><label className="form-label">Contato</label><input type="text" value={formContact} onChange={e => setFormContact(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white" /></div>
              <div className="form-group"><label className="form-label">Categoria</label><select value={formCategory} onChange={e => setFormCategory(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white">{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Prioridade</label><select value={formPriority} onChange={e => setFormPriority(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white">{PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
            </div>
            <div className="form-group"><label className="form-label">Assunto *</label><input type="text" value={formSubject} onChange={e => setFormSubject(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white" /></div>
            <div className="form-group"><label className="form-label">Descrição *</label><textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} rows={4} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white" /></div>
            <button onClick={handleCreateTicket} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded text-xs">Abrir Chamado</button>
          </div>
        ) : selectedTicket ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-sm">{selectedTicket.subject}</h3>
                <p className="text-[10px] text-slate-400">{selectedTicket.resident_name} • {selectedTicket.unit_identifier} • {selectedTicket.category}</p>
              </div>
              <div className="flex gap-2 items-center">
                <select value={selectedTicket.status} onChange={e => updateStatus(selectedTicket.id, e.target.value)} className="bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-white">
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${priorityColor(selectedTicket.priority)} bg-slate-800`}>{selectedTicket.priority}</span>
              </div>
            </div>
            <div className="bg-slate-950 p-3 rounded text-xs text-slate-300 border border-slate-800 whitespace-pre-wrap">{selectedTicket.description}</div>
            <div className="space-y-2 max-h-[40vh] overflow-y-auto">
              {messages.map(m => (
                <div key={m.id} className={`p-3 rounded-lg text-xs ${m.is_internal ? 'bg-amber-950/30 border border-amber-800/30' : 'bg-slate-950 border border-slate-800'}`}>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1">
                    <span className="font-bold">{m.author}</span>
                    {m.is_internal && <span className="text-amber-400 text-[9px] font-bold">🔒 Interno</span>}
                    <span>{new Date(m.created_at).toLocaleString('pt-BR')}</span>
                  </div>
                  <p className="text-slate-200 whitespace-pre-wrap">{m.message}</p>
                </div>
              ))}
              {messages.length === 0 && <p className="text-xs text-slate-500 text-center py-4">Nenhuma mensagem ainda</p>}
            </div>
            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Digite sua mensagem..." className="flex-1 bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white" onKeyDown={e => e.key === 'Enter' && handleSendMessage()} />
              <label className="flex items-center gap-1 text-[10px] text-slate-400 cursor-pointer">
                <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} /> 🔒 Interno
              </label>
              <button onClick={handleSendMessage} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded text-xs">Enviar</button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-slate-500 text-xs">
            Selecione um chamado ou crie um novo
          </div>
        )}
      </div>
    </div>
  );
};

export default Ouvidoria;

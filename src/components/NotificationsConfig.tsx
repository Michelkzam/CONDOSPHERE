import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface NotificationTemplate {
  id: any;
  name: string;
  channel: string;
  subject: string;
  body: string;
  variables: string;
  active: boolean;
  created_at: string;
}

interface QueueItem {
  id: any;
  template_id: any;
  recipient: string;
  channel: string;
  variables_json: string;
  status: string;
  sent_at: string;
  error_message: string;
  created_at: string;
}

const TEMPLATE_VARS = ['{{residente}}', '{{unidade}}', '{{vencimento}}', '{{valor}}', '{{boleto_url}}', '{{pix_copiaecola}}', '{{codigo}}', '{{transportadora}}', '{{assunto}}', '{{chamado_id}}', '{{data}}', '{{horario}}', '{{area}}'];
const CHANNELS = ['whatsapp', 'email', 'sms'];

export const NotificationsConfig: React.FC = () => {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [activeTab, setActiveTab] = useState<'templates' | 'queue' | 'send'>('templates');
  const [showForm, setShowForm] = useState(false);

  // Template form
  const [formName, setFormName] = useState('');
  const [formChannel, setFormChannel] = useState('whatsapp');
  const [formSubject, setFormSubject] = useState('');
  const [formBody, setFormBody] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);

  // Manual send form
  const [sendRecipient, setSendRecipient] = useState('');
  const [sendChannel, setSendChannel] = useState('whatsapp');
  const [sendMessage, setSendMessage] = useState('');
  const [sendTemplateId, setSendTemplateId] = useState('');

  useEffect(() => {
    loadTemplates();
    loadQueue();
  }, []);

  const loadTemplates = async () => {
    const { data } = await supabase.from('notification_templates').select('*').order('name');
    if (data) setTemplates(data as NotificationTemplate[]);
  };

  const loadQueue = async () => {
    const { data } = await supabase.from('notification_queue').select('*').order('created_at', { ascending: false }).limit(50);
    if (data) setQueue(data as QueueItem[]);
  };

  const handleSaveTemplate = async () => {
    if (!formName || !formBody) return alert('Preencha nome e conteúdo do template.');
    const payload = { name: formName, channel: formChannel, subject: formSubject, body: formBody, variables: '' };
    if (editingTemplate) {
      await supabase.from('notification_templates').update(payload).eq('id', editingTemplate.id);
    } else {
      await supabase.from('notification_templates').insert([{ ...payload, active: true }]);
    }
    setShowForm(false);
    setEditingTemplate(null);
    resetForm();
    loadTemplates();
  };

  const editTemplate = (t: NotificationTemplate) => {
    setEditingTemplate(t);
    setFormName(t.name);
    setFormChannel(t.channel);
    setFormSubject(t.subject || '');
    setFormBody(t.body);
    setShowForm(true);
  };

  const toggleActive = async (t: NotificationTemplate) => {
    await supabase.from('notification_templates').update({ active: !t.active }).eq('id', t.id);
    loadTemplates();
  };

  const handleManualSend = async () => {
    if (!sendMessage || !sendRecipient) return alert('Preencha destinatário e mensagem.');
    const payload = {
      template_id: sendTemplateId || null,
      recipient: sendRecipient,
      channel: sendChannel,
      variables_json: '{}',
      status: 'pending'
    };
    await supabase.from('notification_queue').insert([payload]);
    alert('📨 Notificação enfileirada para envio!');
    setSendRecipient(''); setSendMessage(''); setSendTemplateId('');
    loadQueue();
  };

  const retryQueue = async (id: any) => {
    await supabase.from('notification_queue').update({ status: 'pending', error_message: null }).eq('id', id);
    loadQueue();
  };

  const resetForm = () => { setFormName(''); setFormChannel('whatsapp'); setFormSubject(''); setFormBody(''); };

  const statusColor = (s: string) =>
    s === 'sent' || s === 'Sent' ? 'bg-green-500/10 text-green-400' :
    s === 'pending' || s === 'Pending' ? 'bg-amber-500/10 text-amber-400' :
    s === 'failed' || s === 'Failed' ? 'bg-red-500/10 text-red-400' : 'bg-slate-500/10 text-slate-400';

  const insertVar = (varName: string) => {
    setFormBody(prev => prev + ' ' + varName);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-white uppercase">📨 Central de Notificações</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 rounded-lg p-1 max-w-md border border-slate-800">
        {(['templates', 'queue', 'send'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            {tab === 'templates' ? '📋 Templates' : tab === 'queue' ? '📤 Fila' : '✉️ Enviar'}
          </button>
        ))}
      </div>

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <>
          <div className="flex justify-end">
            <button onClick={() => { setShowForm(true); setEditingTemplate(null); resetForm(); }} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded text-xs">+ Novo Template</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {templates.map(t => (
              <div key={t.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white text-sm">{t.name}</h4>
                    <span className="text-[10px] text-slate-400 uppercase">{t.channel}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => toggleActive(t)} className={`text-[9px] px-2 py-1 rounded font-bold ${t.active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {t.active ? 'Ativo' : 'Inativo'}
                    </button>
                    <button onClick={() => editTemplate(t)} className="text-[9px] px-2 py-1 rounded font-bold bg-slate-800 text-slate-400 hover:text-white">Editar</button>
                  </div>
                </div>
                {t.subject && <p className="text-[10px] text-slate-400"><span className="font-bold">Assunto:</span> {t.subject}</p>}
                <p className="text-xs text-slate-300 bg-slate-950 p-2 rounded border border-slate-800 whitespace-pre-wrap max-h-24 overflow-y-auto">{t.body}</p>
              </div>
            ))}
            {templates.length === 0 && <p className="text-xs text-slate-500 col-span-2 text-center py-8">Nenhum template criado</p>}
          </div>
        </>
      )}

      {/* Queue Tab */}
      {activeTab === 'queue' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Destinatário</th>
                  <th className="p-3 text-left">Canal</th>
                  <th className="p-3 text-left">Template</th>
                  <th className="p-3 text-left">Criado em</th>
                  <th className="p-3 text-left">Enviado em</th>
                  <th className="p-3 text-left">Erro</th>
                  <th className="p-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {queue.map(q => (
                  <tr key={q.id} className="hover:bg-slate-800/30">
                    <td className="p-3"><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${statusColor(q.status)}`}>{q.status}</span></td>
                    <td className="p-3">{q.recipient}</td>
                    <td className="p-3 uppercase">{q.channel}</td>
                    <td className="p-3 text-slate-400">{q.template_id?.slice(0, 8) || '-'}</td>
                    <td className="p-3 text-slate-500">{new Date(q.created_at).toLocaleString('pt-BR')}</td>
                    <td className="p-3 text-slate-500">{q.sent_at ? new Date(q.sent_at).toLocaleString('pt-BR') : '-'}</td>
                    <td className="p-3 text-red-400 max-w-[150px] truncate">{q.error_message || '-'}</td>
                    <td className="p-3 text-center">
                      {(q.status === 'failed' || q.status === 'Failed') && (
                        <button onClick={() => retryQueue(q.id)} className="bg-amber-600 hover:bg-amber-500 text-white px-2 py-1 rounded text-[9px] font-bold">Retentar</button>
                      )}
                    </td>
                  </tr>
                ))}
                {queue.length === 0 && <tr><td colSpan={8} className="text-center p-4 text-slate-500">Nenhuma notificação na fila</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Send Tab */}
      {activeTab === 'send' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-2xl space-y-4">
          <h3 className="font-bold text-white text-sm uppercase">✉️ Envio Manual de Notificação</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group"><label className="form-label">Destinatário *</label><input type="text" value={sendRecipient} onChange={e => setSendRecipient(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white" placeholder="Telefone ou email" /></div>
            <div className="form-group"><label className="form-label">Canal</label><select value={sendChannel} onChange={e => setSendChannel(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white">{CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            <div className="form-group col-span-2"><label className="form-label">Template (opcional)</label><select value={sendTemplateId} onChange={e => setSendTemplateId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white">
              <option value="">Mensagem personalizada</option>
              {templates.filter(t => t.active).map(t => <option key={t.id} value={t.id}>{t.name} ({t.channel})</option>)}
            </select></div>
            <div className="form-group col-span-2"><label className="form-label">Mensagem *</label><textarea value={sendMessage} onChange={e => setSendMessage(e.target.value)} rows={4} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white" placeholder="Digite a mensagem..." /></div>
          </div>
          <button onClick={handleManualSend} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded text-xs">📨 Enfileirar Envio</button>
        </div>
      )}

      {/* Template Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-2xl w-full space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm uppercase">{editingTemplate ? 'Editar' : 'Novo'} Template</h3>
              <button onClick={() => { setShowForm(false); setEditingTemplate(null); }} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group"><label className="form-label">Nome *</label><input type="text" value={formName} onChange={e => setFormName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" /></div>
              <div className="form-group"><label className="form-label">Canal</label><select value={formChannel} onChange={e => setFormChannel(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white">{CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div className="form-group col-span-2"><label className="form-label">Assunto (email)</label><input type="text" value={formSubject} onChange={e => setFormSubject(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" /></div>
              <div className="form-group col-span-2">
                <label className="form-label">Conteúdo * <span className="text-slate-500">(variáveis disponíveis:)</span></label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {TEMPLATE_VARS.map(v => (
                    <button key={v} onClick={() => insertVar(v)} className="text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-mono">{v}</button>
                  ))}
                </div>
                <textarea value={formBody} onChange={e => setFormBody(e.target.value)} rows={6} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono text-xs" />
              </div>
            </div>
            <div className="flex gap-2 pt-3 border-t border-slate-800">
              <button onClick={() => { setShowForm(false); setEditingTemplate(null); }} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 rounded text-xs">Cancelar</button>
              <button onClick={handleSaveTemplate} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded text-xs">Salvar Template</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsConfig;

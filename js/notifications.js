/* =====================================================================
   CONDOSPHERE - Sistema de Notificações Push
   Email, SMS, In-App Notifications
   ===================================================================== */

const PushNotifications = {
    // Configurações
    config: {
        emailEnabled: true,
        smsEnabled: false,
        pushEnabled: true,
        maxNotificationsPerDay: 50,
        retentionDays: 90
    },

    // =====================================================================
    // TIPOS DE NOTIFICAÇÃO
    // =====================================================================
    TYPES: {
        // Financeiro
        PAYMENT_DUE: 'payment_due',
        PAYMENT_OVERDUE: 'payment_overdue',
        PAYMENT_RECEIVED: 'payment_received',
        PAYMENT_REMINDER: 'payment_reminder',
        
        // Assembleia
        ASSEMBLY_CREATED: 'assembly_created',
        ASSEMBLY_VOTE_REMINDER: 'assembly_vote_reminder',
        ASSEMBLY_RESULT: 'assembly_result',
        
        // Reserva
        RESERVATION_CONFIRMED: 'reservation_confirmed',
        RESERVATION_CANCELLED: 'reservation_cancelled',
        RESERVATION_REMINDER: 'reservation_reminder',
        
        // Sistema
        SYSTEM_MAINTENANCE: 'system_maintenance',
        SYSTEM_UPDATE: 'system_update',
        NEW_DOCUMENT: 'new_document',
        
        // Portaria
        VISITOR_ARRIVAL: 'visitor_arrival',
        ACCESS_DENIED: 'access_denied',
        
        // RH
        PAYSLIP_READY: 'payslip_ready',
        VACATION_APPROVED: 'vacation_approved',
        VACATION_REJECTED: 'vacation_rejected'
    },

    // =====================================================================
    // CRIAÇÃO DE NOTIFICAÇÕES
    // =====================================================================
    async createNotification(data) {
        const notification = {
            title: data.title,
            message: data.message,
            notification_type: data.type || 'info',
            priority: data.priority || 'normal',
            target_role: data.targetRole || null,
            target_resident_id: data.targetResidentId || null,
            is_read: false,
            metadata: data.metadata || {}
        };

        // Salvar no banco
        const result = await window.CondoAPI.post('notifications', notification);

        // Enviar push se habilitado
        if (this.config.pushEnabled && data.sendPush !== false) {
            await this.sendPushNotification(notification);
        }

        // Enviar email se habilitado
        if (this.config.emailEnabled && data.sendEmail) {
            await this.sendEmailNotification(notification, data.emailAddress);
        }

        return result;
    },

    // =====================================================================
    // ENVIO DE PUSH NOTIFICATION
    // =====================================================================
    async sendPushNotification(notification) {
        // Verificar suporte a Service Workers
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            try {
                const registration = await navigator.serviceWorker.ready;
                
                // Criar notificação in-app
                this.showInAppNotification(notification);
                
                // Tentar push notification nativa
                if (Notification.permission === 'granted') {
                    new Notification(notification.title, {
                        body: notification.message,
                        icon: '/img/logo.png',
                        badge: '/img/badge.png',
                        tag: notification.id || Date.now().toString(),
                        data: { url: window.location.href }
                    });
                }
            } catch (err) {
                console.log('[PUSH] Service Worker não disponível:', err.message);
                this.showInAppNotification(notification);
            }
        } else {
            // Fallback: notificação in-app
            this.showInAppNotification(notification);
        }
    },

    // =====================================================================
    // NOTIFICAÇÃO IN-APP
    // =====================================================================
    showInAppNotification(notification) {
        // Criar elemento de notificação
        const notifEl = document.createElement('div');
        notifEl.className = 'in-app-notification';
        notifEl.innerHTML = `
            <div class="notif-icon ${notification.notification_type}">
                ${this.getTypeIcon(notification.notification_type)}
            </div>
            <div class="notif-content">
                <div class="notif-title">${notification.title}</div>
                <div class="badge" style="font-size:10px">${notification.priority === 'high' ? 'URGENTE' : 'INFO'}</div>
            </div>
            <button class="notif-close" onclick="this.parentElement.remove()">✕</button>
        `;
        
        // Adicionar ao container
        let container = document.getElementById('notif-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notif-container';
            container.style.cssText = 'position:fixed;top:80px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;max-width:350px;';
            document.body.appendChild(container);
        }
        
        container.appendChild(notifEl);
        
        // Auto-remover após 10 segundos
        setTimeout(() => {
            if (notifEl.parentElement) {
                notifEl.style.animation = 'slideOut 0.3s ease forwards';
                setTimeout(() => notifEl.remove(), 300);
            }
        }, 10000);
    },

    getTypeIcon(type) {
        const icons = {
            'payment_due': '💰',
            'payment_overdue': '⚠️',
            'payment_received': '✅',
            'payment_reminder': '🔔',
            'assembly_created': '🗳️',
            'assembly_vote_reminder': '📊',
            'assembly_result': '📋',
            'reservation_confirmed': '📅',
            'reservation_cancelled': '❌',
            'reservation_reminder': '⏰',
            'system_maintenance': '🔧',
            'system_update': '📦',
            'new_document': '📄',
            'visitor_arrival': '👤',
            'access_denied': '🚫',
            'payslip_ready': '💼',
            'vacation_approved': '🏖️',
            'vacation_rejected': '❌',
            'info': 'ℹ️'
        };
        return icons[type] || '🔔';
    },

    // =====================================================================
    // ENVIO DE EMAIL
    // =====================================================================
    async sendEmailNotification(notification, emailAddress) {
        // Integração com serviço de email (SendGrid, Mailgun, etc.)
        console.log('[EMAIL] Enviando para:', emailAddress);
        console.log('[EMAIL] Assunto:', notification.title);
        console.log('[EMAIL] Corpo:', notification.message);
        
        // Aqui seria integrado com API de email
        // Exemplo: SendGrid API
        /*
        await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + SENDGRID_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                personalizations: [{ to: [{ email: emailAddress }] }],
                from: { email: 'noreply@condosphere.com', name: 'CondoSphere' },
                subject: notification.title,
                content: [{ type: 'text/html', value: this.generateEmailHTML(notification) }]
            })
        });
        */
        
        return true;
    },

    generateEmailHTML(notification) {
        return `
        <!DOCTYPE html>
        <html>
        <head><style>body{font-family:Arial,sans-serif;padding:20px;background:#f5f5f5}.card{background:white;border-radius:8px;padding:20px;max-width:600px;margin:0 auto}</style></head>
        <body>
            <div class="card">
                <h2 style="color:#3b82f6">${notification.title}</h2>
                <p>${notification.message}</p>
                <hr style="border:1px solid #eee">
                <p style="color:#999;font-size:12px">CondoSphere ERP - Sistema de Gestão Condominial</p>
            </div>
        </body>
        </html>`;
    },

    // =====================================================================
    // CONSULTA DE NOTIFICAÇÕES
    // =====================================================================
    async getNotifications(filters = {}) {
        return await window.CondoAPI.get('notifications', '*', filters);
    },

    async getUnreadCount(targetRole = null, targetResidentId = null) {
        const filters = { is_read: 'false' };
        if (targetRole) filters.target_role = targetRole;
        if (targetResidentId) filters.target_resident_id = targetResidentId;
        
        const notifications = await this.getNotifications(filters);
        return notifications.length;
    },

    async markAsRead(notificationId) {
        return await window.CondoAPI.put('notifications', notificationId, { is_read: true });
    },

    async markAllAsRead(targetRole = null) {
        const filters = { is_read: 'false' };
        if (targetRole) filters.target_role = targetRole;
        
        const notifications = await this.getNotifications(filters);
        for (const notif of notifications) {
            await this.markAsRead(notif.id);
        }
    },

    // =====================================================================
    // NOTIFICAÇÕES AUTOMÁTICAS
    // =====================================================================
    async sendPaymentReminders() {
        const receivables = await window.CondoAPI.get('receivables', '*', { status: 'Pendente' });
        
        for (const rec of receivables) {
            const dueDate = new Date(rec.due_date);
            const today = new Date();
            const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            
            if (daysUntilDue <= 5 && daysUntilDue > 0) {
                await this.createNotification({
                    title: 'Lembrete de Vencimento',
                    message: `Sua mensalidade de ${rec.identifier} vence em ${daysUntilDue} dia(s). Valor: R$ ${rec.base_value.toFixed(2)}`,
                    type: this.TYPES.PAYMENT_REMINDER,
                    priority: 'normal',
                    targetResidentId: rec.resident_id
                });
            } else if (daysUntilDue <= 0) {
                await this.createNotification({
                    title: 'Mensalidade Vencida',
                    message: `Sua mensalidade de ${rec.identifier} está vencida há ${Math.abs(daysUntilDue)} dia(s). Valor com multa: R$ ${(rec.base_value * 1.02).toFixed(2)}`,
                    type: this.TYPES.PAYMENT_OVERDUE,
                    priority: 'high',
                    targetResidentId: rec.resident_id
                });
            }
        }
    },

    async sendAssemblyNotifications(assembly) {
        await this.createNotification({
            title: 'Nova Assembleia Convocada',
            message: `${assembly.title} - Período: ${new Date(assembly.start_date).toLocaleDateString('pt-BR')} a ${new Date(assembly.end_date).toLocaleDateString('pt-BR')}`,
            type: this.TYPES.ASSEMBLY_CREATED,
            priority: 'high',
            targetRole: 'all'
        });
    },

    async sendReservationConfirmation(reservation) {
        await this.createNotification({
            title: 'Reserva Confirmada',
            message: `Sua reserva de ${reservation.space_name} para ${new Date(reservation.reservation_date).toLocaleDateString('pt-BR')} foi confirmada.`,
            type: this.TYPES.RESERVATION_CONFIRMED,
            priority: 'normal',
            targetResidentId: reservation.resident_id
        });
    }
};

// =====================================================================
// EXPORTAR
// =====================================================================
if (typeof window !== 'undefined') {
    window.PushNotifications = PushNotifications;
}

# Plano de Desenvolvimento - CondoSphere ERP

## Base Legal Brasileira

### Lei 4.591/64 (Condomínio em Edificações)
- **Art. 12**: Cada condômino concorre nas despesas conforme quota-parte
- **Art. 12§2**: Síndico arrecada contribuições e cobra judicialmente
- **Art. 12§3**: Juro moratório 1% ao mês + multa até 20%
- **Art. 22**: Síndico eleito com mandato até 2 anos
- **Art. 23**: Conselho Consultivo (3 condôminos)
- **Art. 24**: Assembleia geral ordinária anual obrigatória
- **Art. 25**: Assembleias extraordinárias (1/4 dos condôminos)

### Código Civil (Arts 1.331-1.358)
- Fração ideal de terreno
- Direitos e deveres dos condôminos
- Administração do condomínio

### Lei 8.245/91 (Lei do Inquilinato)
- Direitos de inquilinos em assembleias
- Notificações e comunicações

### LGPD (Lei 13.709/2018)
- Proteção de dados pessoais dos moradores
- Consentimento para uso de dados
- Direito ao esquecimento

### CLT (Consolidação das Leis do Trabalho)
- Folha de pagamento completa
- Encargos sociais (INSS, FGTS, IRRF)
- Controle de ponto
- Benefícios (VT, VA)

---

## Funcionalidades do Sistema

### 1. Portal do Morador (Restrito)
- Cada morador acessa APENAS suas informações
- Visualização de débitos e pagamentos
- Comunicação com administração
- Solicitações de reserva
- Histórico de acessos

### 2. Portaria & Controle de Acesso
- Interfone funcional (ligação entre moradores)
- Registro de visitantes com foto
- Histórico de acessos em tempo real
- Controle de veículos autorizados

### 3. Gestão Financeira
- Emissão de boletos/PIX automaticamente
- Controle de inadimplência com juros e multas (conforme Art. 12§3)
- Balancete mensal obrigatório
- Fundo de reserva (mínimo 5%)
- Conciliação bancária CNAB240/400
- DRE (Demonstrativo de Resultados)

### 4. Gestão de Pessoal (CLT)
- Cadastro completo de funcionários
- Folha de pagamento com cálculos automáticos:
  - INSS (tabela progressiva)
  - IRRF (tabela progressiva)
  - FGTS (8%)
  - Horas extras (50% e 100%)
  - Adicional noturno (20%)
  - DSR
- Controle de ponto eletrônico
- Benefícios (VT, VA, Convênio)
- Rescisão contratual
- Holerites e informes de rendimento

### 5. Áreas Comuns & Reservas
- Cadastro de áreas com suas taxas
- Calendário de reservas
- Controle de capacidade
- Taxa de limpeza automática

### 6. Assembleias Virtuais
- Criação de pautas de votação
- Voto criptografado
- Quórum calculado por fração ideal
- Ata digital

### 7. Prestadores de Serviço
- Cadastro de contratos
- Controle de pagamentos
- Histórico de serviços

### 8. Relatórios & Documentos
- Balancete mensal (obrigatório)
- DRE
- Mapa de receitas e despesas
- Relatório de inadimplência
- Holerites (PDF)
- Informes de rendimento
- Boletos de cobrança

---

## Modelo de Licenciamento

### Plano Mensal - R$ 97,00/mês
- Até 50 unidades
- Todas as funcionalidades
- Suporte por e-mail
- Atualizações inclusas

### Plano Anual - R$ 897,00/ano (17% desconto)
- Até 50 unidades
- Todas as funcionalidades
- Suporte prioritário
- Atualizações inclusas
- Backup mensal

### Plano Enterprise - R$ 1.797,00/ano
- Unidades ilimitadas
- Multi-condomínio
- API personalizada
- Suporte 24/7
- SLA garantido

---

## Arquitetura Técnica

### Frontend
- HTML5/CSS3/JavaScript vanilla
- Design responsivo
- Tema dark profissional
- Páginas separadas por módulo

### Backend
- Node.js REST API
- PostgreSQL (Supabase Cloud)
- Autenticação JWT
- RBAC (controle de acesso por perfil)

### Banco de Dados
- Schema multi-tenant
- Isolamento por condomínio
- Backup automático

---

## Implementação Faseada

### Fase 1: Core (Semanas 1-2)
- [x] Login e autenticação
- [x] Sidebar e navegação
- [x] Dashboard principal
- [ ] Portal do morador restrito
- [ ] Controle de acesso por perfil

### Fase 2: Financeiro (Semanas 3-4)
- [x] Contas a receber
- [x] Contas a pagar
- [ ] Emissão automática de boletos
- [ ] Cálculo de juros e multas (Art. 12§3)
- [ ] Balancete automático

### Fase 3: Pessoal (Semanas 5-6)
- [x] Cadastro de funcionários
- [x] Folha de pagamento
- [ ] Cálculos CLT automáticos
- [ ] Controle de ponto
- [ ] Benefícios

### Fase 4: Relatórios (Semanas 7-8)
- [x] Geração de PDF
- [ ] Balancete mensal
- [ ] DRE
- [ ] Relatórios gerenciais

### Fase 5: Multi-tenant (Semanas 9-10)
- [ ] Sistema de licenciamento
- [ ] Isolamento por condomínio
- [ ] Gestão de assinaturas

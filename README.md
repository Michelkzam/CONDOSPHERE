# CondoSphere 🌌 - Plataforma de Governança e ERP Comunitário

CondoSphere é um sistema de governança e ERP comunitário de alta performance projetado especificamente para associações de moradores de médio porte (100 a 500 unidades). 

A plataforma foi arquitetada sob os princípios de **Clean Architecture**, **SOLID** e **Tailwind CSS**, operando com 100% de autonomia e resiliência offline através de um protótipo autocontido, além de possuir integração direta com o **Supabase Cloud**.

---

## 🚀 Principais Funcionalidades

### 1. 🔑 Portaria e Controle de Acessos
*   Registro instantâneo de visitantes, prestadores de serviço e moradores.
*   Capacidade de captura/upload de fotos de documentos e identificação facial.
*   Histórico e log de acessos em tempo real com filtros avançados.

### 2. 💼 RH Estratégico, Escalas e Folha de Pagamento CLT
*   Cálculo de folha de pagamento em tempo real, contemplando adicionais de insalubridade, horas extras e encargos sociais.
*   Gestão de escalas de revezamento (12x36, 5x2, 6x1) com controle automatizado de ponto e benefícios (vale-alimentação, vale-transporte).
*   Geração e emissão de avisos de férias, adiantamentos e rescisões contratuais digitais prontas para assinatura.

### 3. 📊 Planejamento Financeiro, Orçamento e Inadimplência
*   Controle granular de **Contas a Receber** com conciliação automática e régua de cobrança ativa.
*   Módulo de **Contas a Pagar** integrado com fluxo de aprovação regimental e borderôs de agendamento bancário (Sicoob/PAGFOR via mTLS).
*   Provisão orçamentária ajustável e corrigida dinamicamente pelo **IPCA**.
*   Gestão de acordos e parcelamentos de inadimplências com simulação de juros e multas em tempo real.

### 4. 📦 Carga Massiva Condominial (.XLSX) Unificada
*   Importador e exportador offline de dados unificados de **Residências**, **Moradores** e **Veículos** operando em uma única planilha Excel multi-abas.
*   Processamento paralelo ultra-rápido de registros com barra de progresso e estatísticas de sucesso em tempo real.

### 5. 🛡️ Segurança Granular por Perfis de Acesso (RBAC)
*   Controle de permissões granular configurado em formato de **acordeões colapsáveis** idênticos ao menu lateral do sistema.
*   Definição precisa de ações de *Ver*, *Criar*, *Editar* e *Excluir* para cada funcionalidade e submenu (incluindo as 9 sub-abas do setor financeiro).

---

## 🛠️ Arquitetura e Engenharia de Software

Para garantir a máxima portabilidade e robustez, foram superados diversos desafios técnicos de ambiente de Sandbox:

1.  **Resiliência a Sandbox e localStorage (`SafeStorage`):** Em ambientes restritos (como iframes do Arena.ai), chamadas ao `window.localStorage` geram exceções de segurança. Desenvolvemos o invólucro `SafeStorage` que intercepta esses erros e salva em memória volatil (RAM) sem quebrar o sistema.
2.  **Inlining da Biblioteca SheetJS:** Embutimos fisicamente os 880KB minificados do **SheetJS (`xlsx.full.min.js`)** direto no arquivo `index.html` para garantir importação e exportação de planilhas 100% offline.
3.  **Compatibilidade de XML Namespace:** Modificamos o interpretador ZIP/XML do leitor de planilhas para utilizar consultas independentes de namespaces com `xmlDoc.getElementsByTagNameNS("*", "row")`, garantindo compatibilidade total em todos os navegadores.

---

## 📂 Estrutura do Repositório

```bash
├── index.html               # Protótipo monólito autônomo (HTML/CSS/JS) com SheetJS inlined
├── supabase_schema.sql      # Script DDL idempotente para setup do banco de dados no Supabase
├── src/
│   ├── App.tsx              # Componente principal do aplicativo React (SPA)
│   ├── components/          # Componentes visuais e funcionais modulares (Tailwind CSS)
│   │   ├── AccessProfiles.tsx
│   │   ├── AccountsPayable.tsx
│   │   ├── AccountsReceivable.tsx
│   │   ├── Assemblies.tsx
│   │   ├── CommonAreas.tsx
│   │   ├── PayablesModule.tsx
│   │   ├── Payroll.tsx
│   │   └── ... (demais módulos do sistema)
│   └── lib/
│       └── supabaseClient.ts # Inicializador do cliente Supabase Browser Client
├── utils/
│   └── supabase/            # Helpers de integração SSR (client, server, middleware)
├── .env.local               # Configurações de chaves de ambiente do Supabase (ignorado no git)
├── package.json             # Dependências de produção e scripts
└── README.md                # Documentação técnica do sistema (esta página)
```

---

## ⚙️ Como Executar o Projeto

### Protótipo Autônomo (Offline)
Basta abrir o arquivo **`index.html`** diretamente em qualquer navegador de sua escolha. Não há necessidade de servidores locais ou conexão com a internet para rodar as simulações, importações/exportações ou interações.

### Projeto em Produção (React/TypeScript)
1. Instale as dependências:
   ```bash
   npm install
   ```
2. Configure as variáveis de ambiente no arquivo `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=seu_url_do_supabase
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua_chave_publica_do_supabase
   ```
3. Execute o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

---

## ☁️ Sincronização com o Supabase
As tabelas e as políticas de segurança de linha (RLS) estão modeladas no arquivo **`supabase_schema.sql`**. Execute este script no editor SQL do seu painel do Supabase para configurar a estrutura de dados ideal.

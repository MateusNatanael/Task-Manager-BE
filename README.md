# 📋 Task & Asset Management - Backend Service (Task-Manager-BE)

Serviço backend responsável pela gestão de ativos, ordens de serviço, cálculo de matriz de prioridades (GUT) e controle do ciclo de vida de tarefas para equipes de manutenção e operações em múltiplas unidades.

---

## 🚀 1. Tech Stack & Ferramentas

- **Runtime & Linguagem:** [Node.js](https://nodejs.org/) (v20+) com [TypeScript](https://www.typescriptlang.org/)
- **Framework Web:** [Express 5](https://expressjs.com/)
- **ORM & Banco de Dados:** [Prisma ORM](https://www.prisma.io/) com [PostgreSQL](https://www.postgresql.org/)
- **Validação de Schemas:** [Zod](https://zod.dev/)
- **Autenticação & Segurança:** JWT (`jsonwebtoken`), hash de senha (`bcryptjs`), `helmet` e `cors`
- **Ambiente de Desenvolvimento:** `tsx` (hot-reload) e Docker Compose para o banco de dados
- **Armazenamento de Arquivos (Planejado):** Compatível com S3 (Cloudflare R2 / AWS S3) via URLs pré-assinadas (*Presigned URLs*)

---

## 🏛️ 2. Arquitetura do Projeto

O projeto adota a arquitetura de **Monólito Modular** (*Modular Monolith*), orientado a domínios de negócio com separação estrita de responsabilidades:
`Route -> Controller -> Service -> Repository (Prisma)`.

```text
src/
├── @types/          # Extensões de tipagem do Express (ex: Request.user)
├── config/          # Configuração de variáveis de ambiente e cliente Prisma
│   ├── env.ts
│   └── prisma.ts
├── shared/          # Recursos transversais e compartilhados
│   ├── errors/      # AppError customizado
│   └── middlewares/ # Autenticação (JWT + RBAC), validação Zod e errorHandler global
├── modules/         # Módulos de domínio
│   ├── users/       # Autenticação, usuários, papéis e especialidades
│   ├── units/       # Cadastro e listagem de filiais/unidades
│   ├── equipment/   # Inventário de ativos e equipamentos
│   └── tasks/       # Engine central de tarefas, matriz GUT e histórico
├── app.ts           # Configuração de middlewares do Express
├── routes.ts        # Registro centralizado de rotas
└── index.ts         # Ponto de entrada do servidor HTTP
```

---

## 📊 3. Status de Implementação

| Funcionalidade / Módulo | Status | Descrição |
| :--- | :---: | :--- |
| **Setup & Infraestrutura** | Concluído | Express, TypeScript, Docker Compose (PostgreSQL), Prisma configurado. |
| **Modelagem do Banco (Prisma)** | Concluído | Models `Unit`, `User`, `Equipment`, `Task`, `TaskLog`, `TaskNote` com Enums. |
| **Database Seed** | Concluído | Unidade matriz, usuários com roles (Gerente e Operador) e equipamentos de teste. |
| **Autenticação (JWT)** | Concluído | Endpoint `/api/auth/login` com validação de senha via `bcryptjs`. |
| **Middlewares Compartilhados** | Concluído | `ensureAuthenticated`, `ensureRole`, `validateBody`, `validateQuery`, `errorHandler`. |
| **Módulo Units** | Concluído | `GET /api/units` (listagem de unidades ativas). |
| **Módulo Users** | Concluído | `GET /api/users` (listagem com filtros por `role` e `unitId`). |
| **Módulo Equipment** | Concluído | `GET /api/equipment` (listagem com filtros por `unitId` e `category`). |
| **Tasks: Criação & Matriz GUT** | Concluído | `POST /api/tasks` restrito a `ANALYST`/`MANAGER`, cálculo atômico do Score GUT e log inicial no `TaskLog`. |
| **Tasks: Listagens & Detalhes** | Concluído | `GET /api/tasks` (ordenado por `priorityScore DESC, createdAt ASC`), `GET /api/tasks/my-tasks` e `GET /api/tasks/:id`. |
| **Tasks: Atribuição (`assign`)** | Concluído | `PATCH /api/tasks/:id/assign` restrito a gestores, validação de usuário ativo e auditoria no `TaskLog`. |
| **Tasks: Transição de Status** | Concluído | `PATCH /api/tasks/:id/status` com transações atômicas, validações de bloqueio (`reason >= 10` e `attachmentUrl`), resolução e aprovação de entrega. |
| **Tasks: Notas & Evidências** | Concluído | `POST /api/tasks/:id/notes` para adição de observações e URLs de imagens por usuários autenticados. |
| **Tasks: Histórico (`history`)** | Concluído | `GET /api/tasks/:id/history` para consulta cronológica de transições e auditoria no `TaskLog`. |
| **Dashboard & Métricas (`metrics`)** | Concluído | `GET /api/tasks/metrics` com contagem por status, criticidade, taxa de bloqueio, lead time médio e top equipamentos. |
| **Uploads & Presigned URLs** | ⏳ Pendente | Integração com S3/R2 para anexos de tarefas e bloqueios. |

---

## ⚙️ 4. Regras de Negócio Principais

### A. Papéis de Usuário (RBAC)
- **Criação de Tarefas:** Exclusiva para `ANALYST` e `MANAGER`.
- **Atribuição:** Gestão (`ANALYST`, `MANAGER`, `SUPERVISOR`, `FOREMAN`).
- **Execução:** Papéis técnicos (`OPERATOR`, `TECHNICIAN`, `FOREMAN`, etc.).

### B. Matriz de Prioridade GUT
O cálculo é efetuado automaticamente na criação da tarefa:
$$\text{Score} = G \times U \times T \quad (1 \le \text{Score} \le 125)$$
- **HIGH:** $\text{Score} \ge 80$
- **MEDIUM:** $30 \le \text{Score} < 80$
- **LOW:** $\text{Score} < 30$

### C. Ciclo de Vida da Tarefa & Transições Atômicas
O ciclo de vida deve registrar transição atômica (`prisma.$transaction`) gravando em `Task` e `TaskLog`:
1. `RECEIVED`: Criada no sistema (log inicial gerado com `previousStatus: null`).
2. `ASSIGNED`: Atribuída a um operador (`ownerId`).
3. `IN_PROGRESS`: Tarefa assumida pelo operador em execução no local.
4. `BLOCKED`: Requer obrigatoriamente justificativa (`reason >= 10` caracteres) e URL do anexo comprobatório (`attachmentUrl`).
5. `DONE`: Tarefa concluída; define `deliveryDate = now()`. A aprovação pelo gestor registra `acceptedDate = now()`.

---

## 📡 5. Contratos de API (Endpoints)

### Health Check
- `GET /health` - Retorna status, uptime e timestamp.

### Autenticação & Usuários
- `POST /api/auth/login`
  - **Body:** `{ "email": "manager@taskmanager.com", "password": "..." }`
  - **Retorno:** Token JWT (`id`, `role`, `unitId`, `name`).
- `GET /api/users` *(Auth obrigatório)*
  - **Query Params:** `?role=OPERATOR&unitId=...`
  - **Retorno:** Lista de usuários (sem o `passwordHash`).

### Unidades & Equipamentos
- `GET /api/units` *(Auth obrigatório)*
  - **Retorno:** Lista de unidades ativas.
- `GET /api/equipment` *(Auth obrigatório)*
  - **Query Params:** `?unitId=...&category=ELECTRICAL`
  - **Retorno:** Lista de equipamentos com dados de localização e categoria.

### Tarefas & Indicadores
- `GET /api/tasks` *(Auth obrigatório)*
  - **Query Params:** `?unitId=...&status=RECEIVED&ownerId=...`
  - **Ordenação padrão:** `priorityScore DESC, createdAt ASC`.
- `GET /api/tasks/my-tasks` *(Auth obrigatório)*
  - Retorna as tarefas onde `ownerId == req.user.id`.
- `GET /api/tasks/metrics` *(Auth obrigatório)*
  - **Query Params:** `?unitId=...&startDate=2026-10-01&endDate=2026-10-31`
  - **Retorno:**
    ```json
    {
      "totalTasks": 42,
      "byStatus": { "RECEIVED": 5, "ASSIGNED": 8, "IN_PROGRESS": 12, "BLOCKED": 3, "DONE": 14 },
      "byCriticality": { "HIGH": 10, "MEDIUM": 22, "LOW": 10 },
      "blockingMetrics": {
        "currentlyBlocked": 3,
        "everBlockedCount": 5,
        "blockingRatePercentage": 11.9
      },
      "completionMetrics": {
        "totalDone": 14,
        "totalAccepted": 11,
        "averageLeadTimeHours": 4.5
      },
      "topEquipments": [
        { "tagId": "GER-01", "category": "ELECTRICAL", "count": 6 }
      ]
    }
    ```
- `GET /api/tasks/:id` *(Auth obrigatório)*
  - Retorna os dados completos da tarefa, unidade, equipamento e responsáveis.
- `POST /api/tasks` *(Auth obrigatório: ANALYST ou MANAGER)*
  - **Body:**
    ```json
    {
      "description": "Substituição do disjuntor principal",
      "unitId": "11111111-1111-4111-8111-111111111111",
      "equipmentId": "uuid-opcional",
      "riskFactor": "Risco de interrupção da rede",
      "gravity": 5,
      "urgency": 4,
      "trend": 4
    }
    ```
- `PATCH /api/tasks/:id/assign` *(Auth obrigatório: ANALYST, MANAGER, SUPERVISOR ou FOREMAN)*
  - **Body:** `{ "ownerId": "uuid-do-operador" }`
  - **Efeito:** Atualiza status para `ASSIGNED` e grava auditoria atômica no `TaskLog`.
- `PATCH /api/tasks/:id/status` *(Auth obrigatório)*
  - **Body:**
    ```json
    {
      "newStatus": "BLOCKED",
      "reason": "Aguardando peças de reposição do fornecedor",
      "attachmentUrl": "https://meubucket.com/evidencia.jpg"
    }
    ```
  - **Validações:**
    - `IN_PROGRESS -> BLOCKED`: Exige `reason >= 10` caracteres e `attachmentUrl` (HTTP 422 se ausente).
    - `BLOCKED -> IN_PROGRESS`: Exige `reason >= 5` caracteres descrevendo a resolução.
    - `IN_PROGRESS -> DONE`: Grava `deliveryDate = now()`.
    - `DONE` (por gestor): Grava `acceptedDate = now()`.
- `POST /api/tasks/:id/notes` *(Auth obrigatório)*
  - **Body:**
    ```json
    {
      "text": "Iniciada a desmontagem dos conectores da base",
      "imageUrls": ["https://meubucket.com/foto1.jpg"]
    }
    ```
- `GET /api/tasks/:id/history` *(Auth obrigatório)*
  - Retorna a lista cronológica ordenada de todas as transições registradas em `TaskLog`.

---

## 🛠️ 6. Como Rodar Localmente

### Pré-requisitos
- Node.js 20+
- Docker & Docker Compose

### Passo a Passo

1. **Clonar e instalar dependências:**
   ```bash
   git clone https://github.com/MateusNatanael/Task-Manager-BE.git
   cd Task-Manager-BE
   npm install
   ```

2. **Configurar variáveis de ambiente:**
   Copie o arquivo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```

3. **Subir o banco de dados (PostgreSQL):**
   ```bash
   docker-compose up -d
   ```

4. **Executar migrações do Prisma e alimentar dados iniciais (Seed):**
   ```bash
   npm run prisma:migrate
   npm run prisma:seed
   ```

5. **Iniciar em modo de desenvolvimento:**
   ```bash
   npm run dev
   ```
   A API estará rodando em `http://localhost:3333`.

6. **Executar os testes automatizados:**
   ```bash
   npm test
   ```

---

## 🧪 7. Usuários de Teste Pré-configurados (Seed)

Após executar `npm run prisma:seed`, as seguintes credenciais ficam disponíveis:

| Usuário | E-mail | Senha | Perfil (Role) | Permissão de Criação de Tarefas |
| :--- | :--- | :---: | :---: | :---: |
| **Carlos Gerente** | `manager@taskmanager.com` | `123456` | `MANAGER` | ✅ Sim |
| **João Operador** | `operator@taskmanager.com` | `123456` | `OPERATOR` | ❌ Não (apenas execução) |

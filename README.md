📋 Backend Technical Specification & Architecture GuidelinesThis document provides system design, data modeling, business constraints, and API contracts for the Task & Asset Management backend service.1. Tech Stack & ArchitectureRuntime: Node.js (v20+) with TypeScriptWeb Framework: Express or FastifyORM: Prisma ORMDatabase: PostgreSQLInput Validation: ZodStorage: S3-compatible (Cloudflare R2 or AWS S3 via presigned URLs)Architecture: Modular Monolith (Controller -> Service -> Repository/ORM), domain-separated modules.2. Directory Structuresrc/
├── config/ # DB client, env vars, storage config
├── shared/ # Global middlewares (auth, errors, logger)
│ ├── errors/
│ └── middlewares/
└── modules/
├── units/ # Physical branches/stores
├── users/ # Roles, auth, assignments
├── equipment/ # Asset inventory
└── tasks/ # Core task engine
├── dtos/ # Zod schemas & payload contracts
├── controllers/
├── services/ # Business logic, state transitions & logs
└── repositories/ 3. Database Schema (prisma/schema.prisma)datasource db {
provider = "postgresql"
url = env("DATABASE_URL")
}

generator client {
provider = "prisma-client-js"
}

enum Role {
ANALYST
MANAGER
SUPERVISOR
FOREMAN
TECHNICIAN
OPERATOR
}

enum Specialty {
ELECTRICAL
MECHANICAL
HVAC
INFRASTRUCTURE
PROJECT
}

enum EquipmentCategory {
ELECTRICAL
MECHANICAL
INFRASTRUCTURE
PROJECT
CABLING
CIVIL
ENGINEERING
}

enum TaskStatus {
RECEIVED
ASSIGNED
IN_PROGRESS
BLOCKED
DONE
}

enum Criticality {
LOW
MEDIUM
HIGH
}

enum MatrixType {
GUT
ICE
NPR
}

model Unit {
id String @id @default(uuid())
name String
address String
criticalityFactor String? @map("criticality_factor")
isActive Boolean @default(true) @map("is_active")
createdAt DateTime @default(now()) @map("created_at")

users User[]
equipments Equipment[]
tasks Task[]

@@map("units")
}

model User {
id String @id @default(uuid())
name String
email String @unique
passwordHash String @map("password_hash")
role Role
specialty Specialty?
unitId String @map("unit_id")
isActive Boolean @default(true) @map("is_active")
createdAt DateTime @default(now()) @map("created_at")

unit Unit @relation(fields: [unitId], references: [id])
tasksCreated Task[] @relation("TasksCreated")
tasksAssigned Task[] @relation("TasksAssigned")
taskTransitions TaskLog[]
taskNotes TaskNote[]

@@map("users")
}

model Equipment {
id String @id @default(uuid())
tagId String @unique @map("tag_id")
category EquipmentCategory
unitId String @map("unit_id")
specificLocation String @map("specific_location")
observedFault String? @map("observed_fault")
preventiveData Json? @default("{}") @map("preventive_data")
createdAt DateTime @default(now()) @map("created_at")

unit Unit @relation(fields: [unitId], references: [id])
tasks Task[]

@@map("equipments")
}

model Task {
id String @id @default(uuid())
seqCode Int @default(autoincrement()) @map("seq_code")
description String
unitId String @map("unit_id")
equipmentId String? @map("equipment_id")
ownerId String? @map("owner_id")
status TaskStatus @default(RECEIVED)
riskFactor String? @map("risk_factor")
matrixType MatrixType @map("matrix_type")
priorityScore Int @map("priority_score")
criticality Criticality
deliveryDate DateTime? @map("delivery_date")
acceptedDate DateTime? @map("accepted_date")
createdById String @map("created_by_id")
createdAt DateTime @default(now()) @map("created_at")
updatedAt DateTime @updatedAt @map("updated_at")

unit Unit @relation(fields: [unitId], references: [id])
equipment Equipment? @relation(fields: [equipmentId], references: [id])
createdBy User @relation("TasksCreated", fields: [createdById], references: [id])
owner User? @relation("TasksAssigned", fields: [ownerId], references: [id])
transitions TaskLog[]
notes TaskNote[]

@@map("tasks")
}

model TaskLog {
id String @id @default(uuid())
taskId String @map("task_id")
userId String @map("user_id")
previousStatus TaskStatus? @map("previous_status")
newStatus TaskStatus @map("new_status")
reason String?
attachmentUrl String? @map("attachment_url")
createdAt DateTime @default(now()) @map("created_at")

task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
user User @relation(fields: [userId], references: [id])

@@map("task_logs")
}

model TaskNote {
id String @id @default(uuid())
taskId String @map("task_id")
userId String @map("user_id")
text String
imageUrls String[] @default([]) @map("image_urls")
createdAt DateTime @default(now()) @map("created_at")

task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
user User @relation(fields: [userId], references: [id])

@@map("task_notes")
} 4. Business Core & State Transition RulesA. Task CreationPermissions: Restricted to ANALYST or MANAGER.Equipment: Optional at creation (equipmentId nullable).Matrix Score Calculation (GUT Example):
$$Score = G \times U \times T \quad (1 \le Score \le 125)$$$Score \ge 80 \implies \text{HIGH}$$30 \le Score < 80 \implies \text{MEDIUM}$$Score < 30 \implies \text{LOW}$Initial Audit Log: Must create initial record in TaskLog (previousStatus: null, newStatus: RECEIVED).B. Atomic Transitions (prisma.$transaction)Every state transition must write to both Task and TaskLog atomically.RECEIVED $\to$ ASSIGNED: Requires ownerId (single technician/operator).ASSIGNED $\to$ IN_PROGRESS: Operator claims and starts execution on site.IN_PROGRESS $\to$ BLOCKED:Mandatory Validation: Both reason ($\ge 10$ chars) and attachmentUrl (proof image) are strictly required. Return HTTP 422 if missing.BLOCKED $\to$ IN_PROGRESS: Requires reason describing the resolution.IN_PROGRESS $\to$ DONE: Sets deliveryDate = now().DONE Validation / Acceptance: Manager approves the delivery, setting acceptedDate = now().5. API EndpointsAuth & UsersPOST /api/auth/login - Returns JWT (id, role, unitId).GET /api/users - User list (?role=OPERATOR&unitId=...).Units & AssetsGET /api/units - Branch/unit listing.GET /api/equipment - Asset list with filters (?unitId=...&category=...).TasksGET /api/tasks - General list sorted by priorityScore DESC, createdAt ASC (?unitId=...&status=...&ownerId=...).GET /api/tasks/my-tasks - Current operator's assigned tasks (ownerId == req.user.id).POST /api/tasks - Create task with matrix calculation.PATCH /api/tasks/:id/assign - Assign owner (ownerId).PATCH /api/tasks/:id/status - Transition status (newStatus, reason, attachmentUrl).POST /api/tasks/:id/notes - Add note/images.GET /api/tasks/:id/history - Chronological transition logs.

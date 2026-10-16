import { PrismaClient, Role, Specialty, EquipmentCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Criar ou buscar Unidade padrão
  const unit = await prisma.unit.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Unidade Central - Matriz',
      address: 'Av. Paulista, 1000 - São Paulo, SP',
      criticalityFactor: 'HIGH',
      isActive: true,
    },
  });

  console.log(`✅ Unit ready: ${unit.name} (${unit.id})`);

  // 2. Hash padrão para senhas
  const passwordHash = await bcrypt.hash('123456', 10);

  // 3. Usuário Gerente / Analista (Permissão para criar tarefas)
  const manager = await prisma.user.upsert({
    where: { email: 'manager@taskmanager.com' },
    update: {},
    create: {
      name: 'Carlos Gerente',
      email: 'manager@taskmanager.com',
      passwordHash,
      role: Role.MANAGER,
      specialty: Specialty.PROJECT,
      unitId: unit.id,
      isActive: true,
    },
  });

  console.log(`✅ Manager user: ${manager.email} (Role: ${manager.role})`);

  // 4. Usuário Operador / Técnico (Para executar e receber tarefas)
  const operator = await prisma.user.upsert({
    where: { email: 'operator@taskmanager.com' },
    update: {},
    create: {
      name: 'João Operador',
      email: 'operator@taskmanager.com',
      passwordHash,
      role: Role.OPERATOR,
      specialty: Specialty.ELECTRICAL,
      unitId: unit.id,
      isActive: true,
    },
  });

  console.log(`✅ Operator user: ${operator.email} (Role: ${operator.role})`);

  // 5. Equipamento de exemplo
  const equipment = await prisma.equipment.upsert({
    where: { tagId: 'GER-01' },
    update: {},
    create: {
      tagId: 'GER-01',
      category: EquipmentCategory.ELECTRICAL,
      unitId: unit.id,
      specificLocation: 'Subsolo 1 - Sala de Geradores',
      observedFault: 'Vibração anormal identificada na última ronda preventiva',
      preventiveData: {
        lastMaintenance: '2026-01-15',
        nextMaintenance: '2026-07-15',
        manufacturer: 'Cummins',
      },
    },
  });

  console.log(`✅ Equipment ready: ${equipment.tagId} - ${equipment.category}`);

  console.log('🌱 Seed finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

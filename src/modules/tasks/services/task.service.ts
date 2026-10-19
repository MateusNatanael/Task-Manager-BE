import { Criticality, MatrixType, Role } from '@prisma/client';
import { TaskRepository, FindTasksFilters } from '../repositories/task.repository';
import { UnitsRepository } from '../../units/repositories/units.repository';
import { EquipmentRepository } from '../../equipment/repositories/equipment.repository';
import { CreateTaskDTO } from '../dtos/task.dto';
import { AppError } from '../../../shared/errors/app-error';

export class TaskService {
  constructor(
    private taskRepository: TaskRepository = new TaskRepository(),
    private unitsRepository: UnitsRepository = new UnitsRepository(),
    private equipmentRepository: EquipmentRepository = new EquipmentRepository()
  ) {}

  static calculateGUTCriticality(gravity: number, urgency: number, trend: number): {
    score: number;
    criticality: Criticality;
  } {
    const score = gravity * urgency * trend;

    let criticality: Criticality = Criticality.LOW;
    if (score >= 80) {
      criticality = Criticality.HIGH;
    } else if (score >= 30) {
      criticality = Criticality.MEDIUM;
    }

    return { score, criticality };
  }

  async createTask(data: CreateTaskDTO, user: { id: string; role: Role }) {
    // 1. Permissão: Restrito a ANALYST ou MANAGER
    const allowedRoles: Role[] = [Role.ANALYST, Role.MANAGER];
    if (!allowedRoles.includes(user.role)) {
      throw new AppError('Only ANALYST or MANAGER roles can create tasks', 403);
    }

    // 2. Validação da Unidade
    const unit = await this.unitsRepository.findById(data.unitId);
    if (!unit || !unit.isActive) {
      throw new AppError('Unit not found or inactive', 404);
    }

    // 3. Validação do Equipamento (opcional)
    if (data.equipmentId) {
      const equipment = await this.equipmentRepository.findById(data.equipmentId);
      if (!equipment) {
        throw new AppError('Equipment not found', 404);
      }
      if (equipment.unitId !== data.unitId) {
        throw new AppError('Equipment does not belong to the specified unit', 400);
      }
    }

    // 4. Cálculo da Matriz de Prioridade (GUT)
    const { score, criticality } = TaskService.calculateGUTCriticality(
      data.gravity,
      data.urgency,
      data.trend
    );

    // 5. Criação Atômica da Tarefa com Log Inicial
    return this.taskRepository.createWithInitialLog({
      description: data.description,
      unitId: data.unitId,
      equipmentId: data.equipmentId,
      matrixType: data.matrixType ?? MatrixType.GUT,
      priorityScore: score,
      criticality,
      riskFactor: data.riskFactor,
      createdById: user.id,
    });
  }

  async listTasks(filters: FindTasksFilters) {
    return this.taskRepository.findAll(filters);
  }

  async listMyTasks(ownerId: string) {
    return this.taskRepository.findByOwnerId(ownerId);
  }

  async getTaskById(id: string) {
    const task = await this.taskRepository.findById(id);
    if (!task) {
      throw new AppError('Task not found', 404);
    }
    return task;
  }
}

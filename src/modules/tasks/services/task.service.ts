import { Criticality, MatrixType, Role, TaskStatus } from '@prisma/client';
import { TaskRepository, FindTasksFilters } from '../repositories/task.repository';
import { UnitsRepository } from '../../units/repositories/units.repository';
import { EquipmentRepository } from '../../equipment/repositories/equipment.repository';
import { UsersRepository } from '../../users/repositories/users.repository';
import { AssignTaskDTO, CreateTaskDTO, CreateTaskNoteDTO, UpdateTaskStatusDTO } from '../dtos/task.dto';
import { AppError } from '../../../shared/errors/app-error';

export class TaskService {
  constructor(
    private taskRepository: TaskRepository = new TaskRepository(),
    private unitsRepository: UnitsRepository = new UnitsRepository(),
    private equipmentRepository: EquipmentRepository = new EquipmentRepository(),
    private usersRepository: UsersRepository = new UsersRepository()
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

  async assignTask(taskId: string, data: AssignTaskDTO, currentUser: { id: string; role: Role }) {
    const allowedRoles: Role[] = [Role.ANALYST, Role.MANAGER, Role.SUPERVISOR, Role.FOREMAN];
    if (!allowedRoles.includes(currentUser.role)) {
      throw new AppError('You do not have permission to assign tasks', 403);
    }

    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    if (task.status === TaskStatus.DONE) {
      throw new AppError('Cannot reassign a completed task', 400);
    }

    const targetUser = await this.usersRepository.findById(data.ownerId);
    if (!targetUser || !targetUser.isActive) {
      throw new AppError('Assigned user not found or inactive', 404);
    }

    return this.taskRepository.assignOwner(
      taskId,
      data.ownerId,
      currentUser.id,
      `Task assigned to ${targetUser.name} (${targetUser.role})`
    );
  }

  async updateTaskStatus(taskId: string, data: UpdateTaskStatusDTO, currentUser: { id: string; role: Role }) {
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    const { newStatus, reason, attachmentUrl } = data;

    // Caso especial: Tarefa já está em DONE e o Gestor/Analista está aceitando a entrega
    if (task.status === TaskStatus.DONE) {
      if (newStatus === TaskStatus.DONE) {
        const canApprove = currentUser.role === Role.MANAGER || currentUser.role === Role.ANALYST;
        if (!canApprove) {
          throw new AppError('Only MANAGER or ANALYST can approve and accept task delivery', 403);
        }

        if (task.acceptedDate) {
          throw new AppError('Task delivery has already been accepted', 400);
        }

        return this.taskRepository.updateStatusWithLog({
          taskId,
          userId: currentUser.id,
          newStatus: TaskStatus.DONE,
          acceptedDate: new Date(),
          reason: reason || 'Task delivery approved and accepted by management',
        });
      }

      throw new AppError('Completed tasks cannot transition to other statuses', 400);
    }

    // Regra: Transição para ASSIGNED
    if (newStatus === TaskStatus.ASSIGNED) {
      if (!task.ownerId) {
        throw new AppError('Task requires an ownerId to transition to ASSIGNED', 400);
      }
    }

    // Regra: Transição para IN_PROGRESS
    if (newStatus === TaskStatus.IN_PROGRESS) {
      if (task.status === TaskStatus.BLOCKED) {
        // Desbloqueio: exige justificativa de resolução
        if (!reason || reason.trim().length < 5) {
          throw new AppError('Unblocking a task requires a reason describing the resolution (minimum 5 characters)', 422);
        }
      } else if (task.status !== TaskStatus.ASSIGNED) {
        throw new AppError('Task must be ASSIGNED or BLOCKED to transition to IN_PROGRESS', 400);
      }
    }

    // Regra: Transição para BLOCKED
    if (newStatus === TaskStatus.BLOCKED) {
      if (task.status !== TaskStatus.IN_PROGRESS) {
        throw new AppError('Only tasks currently IN_PROGRESS can be BLOCKED', 400);
      }

      if (!reason || reason.trim().length < 10 || !attachmentUrl) {
        throw new AppError('Blocking a task requires a reason (>= 10 characters) and an attachmentUrl proof', 422);
      }
    }

    // Regra: Transição para DONE
    let deliveryDate: Date | null = null;
    if (newStatus === TaskStatus.DONE) {
      if (task.status !== TaskStatus.IN_PROGRESS) {
        throw new AppError('Only tasks currently IN_PROGRESS can be marked as DONE', 400);
      }
      deliveryDate = new Date();
    }

    return this.taskRepository.updateStatusWithLog({
      taskId,
      userId: currentUser.id,
      newStatus,
      reason,
      attachmentUrl,
      deliveryDate,
    });
  }

  async addNote(taskId: string, data: CreateTaskNoteDTO, currentUser: { id: string }) {
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    return this.taskRepository.createNote({
      taskId,
      userId: currentUser.id,
      text: data.text,
      imageUrls: data.imageUrls || [],
    });
  }

  async getTaskHistory(taskId: string) {
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    return this.taskRepository.findHistory(taskId);
  }
}

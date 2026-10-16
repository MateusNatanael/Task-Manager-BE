import { Criticality } from '@prisma/client';
import { TaskRepository } from '../repositories/task.repository';

export class TaskService {
  constructor(private taskRepository: TaskRepository = new TaskRepository()) {}

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

  async getTaskById(id: string) {
    return this.taskRepository.findById(id);
  }
}

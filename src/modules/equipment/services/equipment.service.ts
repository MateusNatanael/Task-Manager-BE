import { Role } from '@prisma/client';
import { EquipmentRepository, FindEquipmentFilters } from '../repositories/equipment.repository';
import { UnitsRepository } from '../../units/repositories/units.repository';
import { CreateEquipmentDTO, UpdateEquipmentDTO } from '../dtos/equipment.dto';
import { AppError } from '../../../shared/errors/app-error';

export class EquipmentService {
  constructor(
    private equipmentRepository: EquipmentRepository = new EquipmentRepository(),
    private unitsRepository: UnitsRepository = new UnitsRepository()
  ) {}

  async listEquipment(filters: FindEquipmentFilters) {
    return this.equipmentRepository.findAll(filters);
  }

  async getEquipmentById(id: string) {
    const equipment = await this.equipmentRepository.findById(id);
    if (!equipment) {
      throw new AppError('Equipment not found', 404);
    }
    return equipment;
  }

  async createEquipment(data: CreateEquipmentDTO, currentUser: { role: Role }) {
    const allowedRoles: Role[] = [Role.ANALYST, Role.MANAGER, Role.SUPERVISOR, Role.FOREMAN];
    if (!allowedRoles.includes(currentUser.role)) {
      throw new AppError('You do not have permission to create equipment', 403);
    }

    const unit = await this.unitsRepository.findById(data.unitId);
    if (!unit || !unit.isActive) {
      throw new AppError('Unit not found or inactive', 404);
    }

    const existingWithTag = await this.equipmentRepository.findByTagId(data.tagId);
    if (existingWithTag) {
      throw new AppError(`Equipment with tag ${data.tagId} already exists`, 409);
    }

    return this.equipmentRepository.create(data);
  }

  async updateEquipment(id: string, data: UpdateEquipmentDTO, currentUser: { role: Role }) {
    const allowedRoles: Role[] = [Role.ANALYST, Role.MANAGER, Role.SUPERVISOR, Role.FOREMAN];
    if (!allowedRoles.includes(currentUser.role)) {
      throw new AppError('You do not have permission to update equipment', 403);
    }

    const equipment = await this.equipmentRepository.findById(id);
    if (!equipment) {
      throw new AppError('Equipment not found', 404);
    }

    if (data.unitId && data.unitId !== equipment.unitId) {
      const unit = await this.unitsRepository.findById(data.unitId);
      if (!unit || !unit.isActive) {
        throw new AppError('Unit not found or inactive', 404);
      }
    }

    if (data.tagId && data.tagId !== equipment.tagId) {
      const existingWithTag = await this.equipmentRepository.findByTagId(data.tagId);
      if (existingWithTag && existingWithTag.id !== id) {
        throw new AppError(`Equipment with tag ${data.tagId} already exists`, 409);
      }
    }

    return this.equipmentRepository.update(id, data);
  }

  async getEquipmentTasks(id: string) {
    const equipment = await this.equipmentRepository.findById(id);
    if (!equipment) {
      throw new AppError('Equipment not found', 404);
    }

    return this.equipmentRepository.findTasksByEquipmentId(id);
  }
}


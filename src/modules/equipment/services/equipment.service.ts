import { EquipmentRepository, FindEquipmentFilters } from '../repositories/equipment.repository';

export class EquipmentService {
  constructor(private equipmentRepository: EquipmentRepository = new EquipmentRepository()) {}

  async listEquipment(filters: FindEquipmentFilters) {
    return this.equipmentRepository.findAll(filters);
  }

  async getEquipmentById(id: string) {
    return this.equipmentRepository.findById(id);
  }
}

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EquipmentService } from './equipment.service';
import { EquipmentCategory } from '@prisma/client';

describe('EquipmentService', () => {
  let equipmentService: EquipmentService;
  let equipmentRepositoryMock: any;

  beforeEach(() => {
    equipmentRepositoryMock = {
      findAll: vi.fn(),
      findById: vi.fn(),
    };

    equipmentService = new EquipmentService(equipmentRepositoryMock);
  });

  it('should list equipment with filters', async () => {
    const equipmentMock = [
      { id: 'eq-1', tagId: 'GER-01', category: EquipmentCategory.ELECTRICAL, unitId: 'unit-1' },
    ];
    equipmentRepositoryMock.findAll.mockResolvedValue(equipmentMock);

    const filters = { unitId: 'unit-1', category: EquipmentCategory.ELECTRICAL };
    const result = await equipmentService.listEquipment(filters);

    expect(equipmentRepositoryMock.findAll).toHaveBeenCalledWith(filters);
    expect(result).toEqual(equipmentMock);
  });

  it('should get equipment by id', async () => {
    const equipmentMock = { id: 'eq-1', tagId: 'GER-01', category: EquipmentCategory.ELECTRICAL };
    equipmentRepositoryMock.findById.mockResolvedValue(equipmentMock);

    const result = await equipmentService.getEquipmentById('eq-1');

    expect(equipmentRepositoryMock.findById).toHaveBeenCalledWith('eq-1');
    expect(result).toEqual(equipmentMock);
  });
});

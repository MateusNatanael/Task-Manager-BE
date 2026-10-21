import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EquipmentService } from './equipment.service';
import { EquipmentCategory, Role } from '@prisma/client';
import { AppError } from '../../../shared/errors/app-error';

describe('EquipmentService', () => {
  let equipmentService: EquipmentService;
  let equipmentRepositoryMock: any;
  let unitsRepositoryMock: any;

  beforeEach(() => {
    equipmentRepositoryMock = {
      findAll: vi.fn(),
      findById: vi.fn(),
      findByTagId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findTasksByEquipmentId: vi.fn(),
    };

    unitsRepositoryMock = {
      findById: vi.fn(),
    };

    equipmentService = new EquipmentService(equipmentRepositoryMock, unitsRepositoryMock);
  });

  describe('listEquipment and getEquipmentById', () => {
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

    it('should return equipment by id', async () => {
      const equipmentMock = { id: 'eq-1', tagId: 'GER-01', category: EquipmentCategory.ELECTRICAL };
      equipmentRepositoryMock.findById.mockResolvedValue(equipmentMock);

      const result = await equipmentService.getEquipmentById('eq-1');

      expect(equipmentRepositoryMock.findById).toHaveBeenCalledWith('eq-1');
      expect(result).toEqual(equipmentMock);
    });

    it('should throw 404 if equipment does not exist', async () => {
      equipmentRepositoryMock.findById.mockResolvedValue(null);

      await expect(equipmentService.getEquipmentById('eq-999')).rejects.toThrow(
        new AppError('Equipment not found', 404)
      );
    });
  });

  describe('createEquipment', () => {
    const payload = {
      tagId: 'GER-02',
      category: EquipmentCategory.ELECTRICAL,
      unitId: 'unit-1',
      specificLocation: 'Sala de Máquinas B',
      observedFault: null,
      preventiveData: {},
    };

    it('should throw 403 when user does not have permission', async () => {
      await expect(
        equipmentService.createEquipment(payload, { role: Role.OPERATOR })
      ).rejects.toThrow(new AppError('You do not have permission to create equipment', 403));
    });

    it('should throw 404 when unit does not exist or is inactive', async () => {
      unitsRepositoryMock.findById.mockResolvedValue(null);

      await expect(
        equipmentService.createEquipment(payload, { role: Role.MANAGER })
      ).rejects.toThrow(new AppError('Unit not found or inactive', 404));
    });

    it('should throw 409 when tagId is already in use', async () => {
      unitsRepositoryMock.findById.mockResolvedValue({ id: 'unit-1', isActive: true });
      equipmentRepositoryMock.findByTagId.mockResolvedValue({ id: 'eq-existing', tagId: 'GER-02' });

      await expect(
        equipmentService.createEquipment(payload, { role: Role.MANAGER })
      ).rejects.toThrow(new AppError('Equipment with tag GER-02 already exists', 409));
    });

    it('should create equipment successfully', async () => {
      unitsRepositoryMock.findById.mockResolvedValue({ id: 'unit-1', isActive: true });
      equipmentRepositoryMock.findByTagId.mockResolvedValue(null);
      const createdMock = { id: 'eq-new', ...payload };
      equipmentRepositoryMock.create.mockResolvedValue(createdMock);

      const result = await equipmentService.createEquipment(payload, { role: Role.MANAGER });

      expect(equipmentRepositoryMock.create).toHaveBeenCalledWith(payload);
      expect(result).toEqual(createdMock);
    });
  });

  describe('updateEquipment', () => {
    it('should throw 403 when user does not have permission', async () => {
      await expect(
        equipmentService.updateEquipment('eq-1', { observedFault: 'Novo defeito' }, { role: Role.OPERATOR })
      ).rejects.toThrow(new AppError('You do not have permission to update equipment', 403));
    });

    it('should throw 404 when equipment does not exist', async () => {
      equipmentRepositoryMock.findById.mockResolvedValue(null);

      await expect(
        equipmentService.updateEquipment('eq-999', { observedFault: 'Defeito' }, { role: Role.MANAGER })
      ).rejects.toThrow(new AppError('Equipment not found', 404));
    });

    it('should throw 409 when new tagId belongs to another equipment', async () => {
      equipmentRepositoryMock.findById.mockResolvedValue({ id: 'eq-1', tagId: 'GER-01', unitId: 'unit-1' });
      equipmentRepositoryMock.findByTagId.mockResolvedValue({ id: 'eq-other', tagId: 'GER-DUPLICADO' });

      await expect(
        equipmentService.updateEquipment('eq-1', { tagId: 'GER-DUPLICADO' }, { role: Role.MANAGER })
      ).rejects.toThrow(new AppError('Equipment with tag GER-DUPLICADO already exists', 409));
    });

    it('should update equipment successfully', async () => {
      equipmentRepositoryMock.findById.mockResolvedValue({ id: 'eq-1', tagId: 'GER-01', unitId: 'unit-1' });
      const updatedMock = { id: 'eq-1', tagId: 'GER-01', observedFault: 'Rolamento com ruído' };
      equipmentRepositoryMock.update.mockResolvedValue(updatedMock);

      const result = await equipmentService.updateEquipment(
        'eq-1',
        { observedFault: 'Rolamento com ruído' },
        { role: Role.MANAGER }
      );

      expect(equipmentRepositoryMock.update).toHaveBeenCalledWith('eq-1', { observedFault: 'Rolamento com ruído' });
      expect(result).toEqual(updatedMock);
    });
  });

  describe('getEquipmentTasks', () => {
    it('should throw 404 when equipment does not exist', async () => {
      equipmentRepositoryMock.findById.mockResolvedValue(null);

      await expect(equipmentService.getEquipmentTasks('eq-999')).rejects.toThrow(
        new AppError('Equipment not found', 404)
      );
    });

    it('should return tasks associated with equipment', async () => {
      equipmentRepositoryMock.findById.mockResolvedValue({ id: 'eq-1', tagId: 'GER-01' });
      const tasksMock = [{ id: 'task-1', description: 'Revisão semestral' }];
      equipmentRepositoryMock.findTasksByEquipmentId.mockResolvedValue(tasksMock);

      const result = await equipmentService.getEquipmentTasks('eq-1');

      expect(equipmentRepositoryMock.findTasksByEquipmentId).toHaveBeenCalledWith('eq-1');
      expect(result).toEqual(tasksMock);
    });
  });
});

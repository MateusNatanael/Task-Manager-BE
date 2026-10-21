import { Request, Response } from 'express';
import { EquipmentService } from '../services/equipment.service';
import { EquipmentCategory } from '@prisma/client';
import { AppError } from '../../../shared/errors/app-error';

export class EquipmentController {
  constructor(private equipmentService: EquipmentService = new EquipmentService()) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const { unitId, category } = req.query;

    const equipments = await this.equipmentService.listEquipment({
      unitId: unitId ? String(unitId) : undefined,
      category: category ? (category as EquipmentCategory) : undefined,
    });

    res.json(equipments);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      throw new AppError('Equipment ID is required', 400);
    }

    const equipment = await this.equipmentService.getEquipmentById(id);
    res.json(equipment);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const equipment = await this.equipmentService.createEquipment(req.body, {
      role: req.user.role,
    });

    res.status(201).json(equipment);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      throw new AppError('Equipment ID is required', 400);
    }

    const updated = await this.equipmentService.updateEquipment(id, req.body, {
      role: req.user.role,
    });

    res.json(updated);
  };

  tasks = async (req: Request, res: Response): Promise<void> => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      throw new AppError('Equipment ID is required', 400);
    }

    const tasks = await this.equipmentService.getEquipmentTasks(id);
    res.json(tasks);
  };
}


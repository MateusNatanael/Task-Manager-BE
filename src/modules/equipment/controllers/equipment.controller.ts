import { Request, Response } from 'express';
import { EquipmentService } from '../services/equipment.service';
import { EquipmentCategory } from '@prisma/client';

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
}

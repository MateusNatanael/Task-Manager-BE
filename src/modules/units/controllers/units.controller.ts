import { Request, Response } from 'express';
import { UnitsService } from '../services/units.service';

export class UnitsController {
  constructor(private unitsService: UnitsService = new UnitsService()) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    const units = await this.unitsService.listUnits();
    res.json(units);
  };
}

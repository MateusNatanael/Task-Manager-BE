import { UnitsRepository } from '../repositories/units.repository';

export class UnitsService {
  constructor(private unitsRepository: UnitsRepository = new UnitsRepository()) {}

  async listUnits() {
    return this.unitsRepository.findAll(true);
  }
}

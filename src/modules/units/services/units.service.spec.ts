import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnitsService } from './units.service';

describe('UnitsService', () => {
  let unitsService: UnitsService;
  let unitsRepositoryMock: any;

  beforeEach(() => {
    unitsRepositoryMock = {
      findAll: vi.fn(),
      findById: vi.fn(),
    };

    unitsService = new UnitsService(unitsRepositoryMock);
  });

  it('should list only active units', async () => {
    const unitsMock = [
      { id: 'unit-1', name: 'Unidade Matriz', isActive: true },
      { id: 'unit-2', name: 'Unidade Filial', isActive: true },
    ];
    unitsRepositoryMock.findAll.mockResolvedValue(unitsMock);

    const result = await unitsService.listUnits();

    expect(unitsRepositoryMock.findAll).toHaveBeenCalledWith(true);
    expect(result).toEqual(unitsMock);
    expect(result).toHaveLength(2);
  });
});

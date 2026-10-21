import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth.service';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError } from '../../../shared/errors/app-error';

describe('AuthService', () => {
  let authService: AuthService;
  let usersRepositoryMock: any;

  beforeEach(() => {
    usersRepositoryMock = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
    };

    authService = new AuthService(usersRepositoryMock);
  });

  it('should authenticate user with valid credentials and return JWT token', async () => {
    const passwordHash = await bcrypt.hash('123456', 8);
    const userMock = {
      id: 'user-1',
      name: 'Carlos Gerente',
      email: 'manager@taskmanager.com',
      passwordHash,
      role: Role.MANAGER,
      specialty: null,
      unitId: 'unit-1',
      isActive: true,
    };

    usersRepositoryMock.findByEmail.mockResolvedValue(userMock);

    const result = await authService.authenticate({
      email: 'manager@taskmanager.com',
      password: '123456',
    });

    expect(result).toHaveProperty('token');
    expect(result.user).toEqual({
      id: 'user-1',
      name: 'Carlos Gerente',
      email: 'manager@taskmanager.com',
      role: Role.MANAGER,
      specialty: null,
      unitId: 'unit-1',
    });

    const decoded = jwt.decode(result.token) as any;
    expect(decoded.id).toBe('user-1');
    expect(decoded.role).toBe(Role.MANAGER);
  });

  it('should throw 401 when user is not found', async () => {
    usersRepositoryMock.findByEmail.mockResolvedValue(null);

    await expect(
      authService.authenticate({
        email: 'inexistente@taskmanager.com',
        password: '123456',
      })
    ).rejects.toThrow(new AppError('Invalid email or password', 401));
  });

  it('should throw 401 when user is inactive', async () => {
    usersRepositoryMock.findByEmail.mockResolvedValue({
      id: 'user-inactive',
      email: 'inactive@taskmanager.com',
      passwordHash: 'hash',
      isActive: false,
    });

    await expect(
      authService.authenticate({
        email: 'inactive@taskmanager.com',
        password: '123456',
      })
    ).rejects.toThrow(new AppError('Invalid email or password', 401));
  });

  it('should throw 401 when password does not match', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 8);
    usersRepositoryMock.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'user@taskmanager.com',
      passwordHash,
      isActive: true,
    });

    await expect(
      authService.authenticate({
        email: 'user@taskmanager.com',
        password: 'wrong-password',
      })
    ).rejects.toThrow(new AppError('Invalid email or password', 401));
  });
});

import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { UsersRepository } from '../repositories/users.repository';
import { LoginDTO } from '../dtos/auth.dto';
import { AppError } from '../../../shared/errors/app-error';
import { env } from '../../../config/env';

export class AuthService {
  constructor(private usersRepository: UsersRepository = new UsersRepository()) {}

  async authenticate({ email, password }: LoginDTO) {
    const user = await this.usersRepository.findByEmail(email);

    if (!user || !user.isActive) {
      throw new AppError('Invalid email or password', 401);
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      throw new AppError('Invalid email or password', 401);
    }

    const signOptions: SignOptions = {
      expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
    };

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        unitId: user.unitId,
      },
      env.JWT_SECRET,
      signOptions
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        specialty: user.specialty,
        unitId: user.unitId,
      },
    };
  }
}

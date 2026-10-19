import { UsersRepository, FindUsersFilters } from '../repositories/users.repository';

export class UsersService {
  constructor(private usersRepository: UsersRepository = new UsersRepository()) {}

  async listUsers(filters: FindUsersFilters) {
    return this.usersRepository.findAll(filters);
  }
}

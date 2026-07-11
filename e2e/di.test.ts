import { describe, it, expect } from 'vitest';
import { container, Inject } from '../src/index.js';

describe('Dependency Injection E2E Flow', () => {
  it('should run a full application bootstrapping and DI workflow', () => {
    // 1. Define tokens and classes
    const CONFIG_TOKEN = Symbol('Config');

    interface AppConfig {
      dbUrl: string;
      port: number;
    }

    class DatabaseService {
      readonly url: string;

      constructor(url: string) {
        this.url = url;
      }

      query(sql: string) {
        return `Result of "${sql}" from ${this.url}`;
      }
    }

    class UserRepository {
      @Inject(CONFIG_TOKEN)
      accessor config!: AppConfig;

      @Inject(DatabaseService)
      accessor db!: DatabaseService;

      getUser(id: string) {
        return {
          id,
          name: 'John Doe',
          dbInfo: this.db.query(`SELECT * FROM users WHERE id = ${id}`),
          portUsed: this.config.port
        };
      }
    }

    class UserService {
      @Inject(UserRepository)
      accessor userRepo!: UserRepository;

      getUserDetails(id: string) {
        return this.userRepo.getUser(id);
      }
    }

    // 2. Register providers in the container
    const configValue: AppConfig = {
      dbUrl: 'mongodb://localhost:27017/prod',
      port: 8080
    };

    container.register(CONFIG_TOKEN, { useValue: configValue });

    container.register(DatabaseService, {
      useFactory: () => {
        const config = container.get<AppConfig>(CONFIG_TOKEN);
        return new DatabaseService(config.dbUrl);
      }
    });

    container.register(UserRepository, { useClass: UserRepository });
    container.register(UserService, { useClass: UserService });

    // 3. Freeze container to finalize configurations
    container.freeze();

    // 4. Resolve the root service and verify behavior
    const userService = container.get(UserService);
    expect(userService).toBeInstanceOf(UserService);

    const userDetails = userService.getUserDetails('42');
    expect(userDetails).toEqual({
      id: '42',
      name: 'John Doe',
      dbInfo: 'Result of "SELECT * FROM users WHERE id = 42" from mongodb://localhost:27017/prod',
      portUsed: 8080
    });

    // Verify singletons
    const db1 = container.get(DatabaseService);
    const db2 = container.get(DatabaseService);
    expect(db1).toBe(db2);

    const userRepo1 = container.get(UserRepository);
    const userRepo2 = container.get(UserRepository);
    expect(userRepo1).toBe(userRepo2);

    // 5. Clean up/dispose container
    container.dispose();
    expect(() => container.get(UserService)).toThrow();
  });
});

import { describe, it, expect } from '../test/setup.js';
import { container, Inject } from '../src/index.js';

// E2E Test Services
class Logger {
  log(message: string): string {
    return `[Logger] ${message}`;
  }
}

class Config {
  readonly apiUrl = 'https://api.example.com';
}

class ApiService {
  @Inject(Config)
  accessor config!: Config;

  @Inject(Logger)
  accessor logger!: Logger;

  fetchData(path: string): string {
    const url = `${this.config.apiUrl}${path}`;
    return this.logger.log(`Fetching from ${url}`);
  }
}

class UserService {
  @Inject(ApiService)
  accessor apiService!: ApiService;

  getUser(id: string): string {
    return this.apiService.fetchData(`/users/${id}`);
  }
}

describe('DI End-to-End Tests', () => {
  it('should resolve deep nested dependency trees recursively', () => {
    const userService = container.get(UserService);

    expect(userService).toBeInstanceOf(UserService);
    expect(userService.apiService).toBeInstanceOf(ApiService);
    expect(userService.apiService.config).toBeInstanceOf(Config);
    expect(userService.apiService.logger).toBeInstanceOf(Logger);

    const logOutput = userService.getUser('123');
    expect(logOutput).toBe('[Logger] Fetching from https://api.example.com/users/123');
  });

  it('should support factory provider injections dynamically', () => {
    const customValue = 'e2e-custom-payload';
    const payloadProvider = {
      useFactory: () => {
        return { payload: customValue };
      }
    };

    class PayloadService {
      @Inject(payloadProvider)
      accessor data!: { payload: string };
    }

    const payloadService = container.get(PayloadService);
    expect(payloadService.data.payload).toBe(customValue);

    // Verify it is cached as a singleton
    const payloadService2 = container.get(PayloadService);
    expect(payloadService.data).toBe(payloadService2.data);
  });

  it('should resolve circular dependencies lazily without throwing call stack errors', () => {
    class CircularA {
      @Inject({ useFactory: () => container.get(CircularB) })
      accessor b!: CircularB;
      ping() {
        return 'ping';
      }
    }

    class CircularB {
      @Inject({ useFactory: () => container.get(CircularA) })
      accessor a!: CircularA;
      pong() {
        return this.a.ping() + ' pong';
      }
    }

    const b = container.get(CircularB);
    expect(b.pong()).toBe('ping pong');
  });

  it('should enforce strict read-only and initialization rules', () => {
    const userService = container.get(UserService);

    // Reassignment check
    expect(() => {
      (userService as any).apiService = {};
    }).toThrow(/Dependency Injection Violation: Cannot reassign read-only injected property/);

    // Initialization check
    expect(() => {
      class BadE2EClass {
        @Inject(Logger)
        accessor logger = new Logger();
      }
      new BadE2EClass();
    }).toThrow(/Dependency Injection Violation: Cannot initialize injected property/);
  });
});

import { describe, it, expect } from '../test/setup.js';
import { container } from './container.js';
import { Inject } from './inject.js';

class Dependency {
  value = 'dep';
}

class RootService {
  @Inject(Dependency)
  accessor dep!: Dependency;
}

describe('Container Tests', () => {
  it('should lazily create and cache singleton instances', () => {
    const service1 = container.get(RootService);
    const service2 = container.get(RootService);

    // Resolve identical singleton container instances
    expect(service1).toBe(service2);
    expect(service1.dep).toBe(service2.dep);
    expect(service1.dep).toBeInstanceOf(Dependency);
  });

  it('should resolve FactoryProviders', () => {
    let calls = 0;
    const provider = {
      useFactory: () => {
        calls++;
        return 'resolved-value';
      }
    };

    class Client {
      @Inject(provider)
      accessor value!: string;
    }

    const c1 = container.get(Client);
    const c2 = container.get(Client);

    expect(c1.value).toBe('resolved-value');
    expect(c2.value).toBe('resolved-value');
    expect(calls).toBe(1); // Cached singleton
  });

  it('should resolve circular dependencies lazily', () => {
    class CircA {
      @Inject({ useFactory: () => container.get(CircB) })
      accessor b!: CircB;
    }

    class CircB {
      @Inject({ useFactory: () => container.get(CircA) })
      accessor a!: CircA;
    }

    const a = container.get(CircA);
    const b = container.get(CircB);

    expect(a.b).toBe(b);
    expect(b.a).toBe(a);
  });
});

import { describe, it, expect } from '../test/setup.js';
import { container } from './container.js';
import { Inject } from './inject.js';

class MockLogger {
  log(msg: string) {
    return msg;
  }
}

class SampleService {
  @Inject(MockLogger)
  accessor logger!: MockLogger;
}

describe('Inject Decorator Tests', () => {
  it('should enforce read-only immutability at runtime', () => {
    const service = container.get(SampleService);
    expect(() => {
      (service as any).logger = new MockLogger();
    }).toThrow(/Dependency Injection Violation: Cannot reassign read-only injected property/);
  });

  it('should prevent default property initializations at runtime', () => {
    expect(() => {
      class InvalidInitializerClass {
        @Inject(MockLogger)
        accessor logger = new MockLogger();
      }
      new InvalidInitializerClass();
    }).toThrow(/Dependency Injection Violation: Cannot initialize injected property/);
  });

  it('should enforce accessor-only decorating at runtime', () => {
    expect(() => {
      const decorator = Inject(MockLogger);
      decorator(
        undefined as any,
        {
          kind: 'field',
          name: 'logger',
          static: false,
          private: false,
          addInitializer: () => {}
        } as any
      );
    }).toThrow(/@Inject can only be used on accessor properties/);
  });
});

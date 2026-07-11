import { describe, it, expect, beforeEach } from 'vitest';
import { Inject } from './inject.js';
import { container } from './container.js';

describe('@Inject decorator', () => {
  beforeEach(() => {
    container.dispose();
  });

  it('should inject dependencies into accessors from the container', () => {
    class Logger {
      log(msg: string) {
        return `log: ${msg}`;
      }
    }

    container.register(Logger, { useClass: Logger });

    class Client {
      @Inject(Logger)
      accessor logger!: Logger;
    }

    const client = new Client();
    expect(client.logger).toBeInstanceOf(Logger);
    expect(client.logger.log('hello')).toBe('log: hello');
  });

  it('should throw TypeError when trying to set/assign an injected dependency', () => {
    class Logger {}
    container.register(Logger, { useClass: Logger });

    class Client {
      @Inject(Logger)
      accessor logger!: Logger;
    }

    const client = new Client();
    expect(() => {
      (client as any).logger = new Logger();
    }).toThrow(TypeError);
    expect(() => {
      (client as any).logger = new Logger();
    }).toThrow('Cannot assign to injected dependency "logger".');
  });

  it('should throw TypeError when applied to a non-accessor kind', () => {
    const decorator = Inject('token');

    // Simulate applying decorator to a field/method (kind: 'field')
    const mockContext = {
      kind: 'field',
      name: 'prop',
      private: false,
      static: false
    } as any;

    expect(() => decorator(undefined as any, mockContext)).toThrow(TypeError);
    expect(() => decorator(undefined as any, mockContext)).toThrow(
      '@Inject can only be applied to accessor properties.'
    );
  });

  it('should throw TypeError when applied to a private accessor', () => {
    const decorator = Inject('token');

    // Simulate applying decorator to a private accessor
    const mockContext = {
      kind: 'accessor',
      name: 'prop',
      private: true,
      static: false
    } as any;

    expect(() => decorator(undefined as any, mockContext)).toThrow(TypeError);
    expect(() => decorator(undefined as any, mockContext)).toThrow(
      '@Inject cannot be applied to private accessors.'
    );
  });

  it('should throw TypeError if the accessor has a default value', () => {
    const decorator = Inject('token');

    const mockContext = {
      kind: 'accessor',
      name: 'prop',
      private: false,
      static: false
    } as any;

    const result = decorator(undefined as any, mockContext);
    expect(result).toBeDefined();

    // Test the init hook of the decorator result
    if (result && typeof result === 'object' && 'init' in result) {
      expect(() => result.init!('default_value' as any)).toThrow(TypeError);
      expect(() => result.init!('default_value' as any)).toThrow(
        'Injected dependency "prop" cannot have a default value.'
      );

      // Should succeed with undefined
      expect(result.init!(undefined)).toBeUndefined();
    } else {
      expect.fail('Decorator did not return accessor descriptor containing init method.');
    }
  });
});

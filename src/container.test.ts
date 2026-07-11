import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Container } from './container.js';
import {
  CircularDependencyError,
  DuplicateProviderError,
  FrozenContainerError,
  InvalidProviderError,
  ProviderNotFoundError
} from './errors.js';

describe('Container', () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
  });

  describe('register & get', () => {
    it('should register and resolve a value provider', () => {
      const token = 'config';
      const value = { apiUrl: 'http://localhost' };
      container.register(token, { useValue: value });
      expect(container.get(token)).toBe(value);
    });

    it('should register and resolve a factory provider', () => {
      const token = 'apiKey';
      const factory = vi.fn(() => 'secret-123');
      container.register(token, { useFactory: factory });
      expect(container.get(token)).toBe('secret-123');
      expect(factory).toHaveBeenCalledTimes(1);

      // Should be cached as a singleton
      expect(container.get(token)).toBe('secret-123');
      expect(factory).toHaveBeenCalledTimes(1);
    });

    it('should register and resolve a class provider', () => {
      class Service {
        id = Math.random();
      }
      container.register(Service, { useClass: Service });
      const instance1 = container.get(Service);
      const instance2 = container.get(Service);
      expect(instance1).toBeInstanceOf(Service);
      expect(instance1).toBe(instance2); // Singleton
    });

    it('should throw ProviderNotFoundError if token is not registered', () => {
      expect(() => container.get('non-existent')).toThrow(ProviderNotFoundError);
    });

    it('should throw DuplicateProviderError if registering the same token twice without override', () => {
      container.register('token', { useValue: 1 });
      expect(() => container.register('token', { useValue: 2 })).toThrow(DuplicateProviderError);
    });

    it('should allow overriding when register option override is true', () => {
      container.register('token', { useValue: 1 });
      container.get('token'); // Cache it
      container.register('token', { useValue: 2 }, { override: true });
      expect(container.get('token')).toBe(2);
    });

    it('should throw InvalidProviderError for invalid providers', () => {
      // @ts-expect-error - testing runtime check
      expect(() => container.register('token', {})).toThrow(InvalidProviderError);
    });
  });

  describe('freeze', () => {
    it('should prevent registration after container is frozen', () => {
      container.register('token1', { useValue: 1 });
      container.freeze();
      expect(() => container.register('token2', { useValue: 2 })).toThrow(FrozenContainerError);
    });
  });

  describe('clear', () => {
    it('should clear cached instances but keep registrations', () => {
      let factoryCalls = 0;
      container.register('token', { useFactory: () => ++factoryCalls });

      expect(container.get('token')).toBe(1);
      expect(container.get('token')).toBe(1); // Cached

      container.clear();

      expect(container.get('token')).toBe(2); // Recalculated
    });
  });

  describe('circular dependency detection', () => {
    it('should throw CircularDependencyError on circular references', () => {
      // A depends on B, B depends on A
      container.register('A', {
        useFactory: () => {
          return container.get('B');
        }
      });
      container.register('B', {
        useFactory: () => {
          return container.get('A');
        }
      });

      expect(() => container.get('A')).toThrow(CircularDependencyError);
    });
  });

  describe('dispose', () => {
    it('should dispose components with Symbol.dispose', () => {
      const disposeSpy = vi.fn();
      const disposable = {
        [Symbol.dispose]: disposeSpy
      };
      container.register('disposable', { useValue: disposable });
      container.get('disposable'); // Instantialize/cache

      container.dispose();
      expect(disposeSpy).toHaveBeenCalledTimes(1);
    });

    it('should dispose components with dispose() function', () => {
      const disposeSpy = vi.fn();
      const disposable = {
        dispose: disposeSpy
      };
      container.register('disposable', { useValue: disposable });
      container.get('disposable');

      container.dispose();
      expect(disposeSpy).toHaveBeenCalledTimes(1);
    });

    it('should reset frozen state, clear providers and instances', () => {
      container.register('token', { useValue: 1 });
      container.freeze();
      container.dispose();

      // Can register again as frozen is reset, and original providers are gone
      container.register('token', { useValue: 2 });
      expect(container.get('token')).toBe(2);
    });
  });
});

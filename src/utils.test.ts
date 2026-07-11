import { describe, it, expect } from 'vitest';
import { isClassProvider, isFactoryProvider, isValueProvider } from './utils.js';
import type { Provider } from './types.js';

describe('utils', () => {
  describe('isClassProvider', () => {
    it('should return true for a class provider', () => {
      const provider: Provider = { useClass: class Test {} };
      expect(isClassProvider(provider)).toBe(true);
    });

    it('should return false for value or factory providers', () => {
      const valProvider: Provider = { useValue: 'test' };
      const factProvider: Provider = { useFactory: () => 'test' };
      expect(isClassProvider(valProvider)).toBe(false);
      expect(isClassProvider(factProvider)).toBe(false);
    });
  });

  describe('isFactoryProvider', () => {
    it('should return true for a factory provider', () => {
      const provider: Provider = { useFactory: () => 'test' };
      expect(isFactoryProvider(provider)).toBe(true);
    });

    it('should return false for class or value providers', () => {
      const classProvider: Provider = { useClass: class Test {} };
      const valProvider: Provider = { useValue: 'test' };
      expect(isFactoryProvider(classProvider)).toBe(false);
      expect(isFactoryProvider(valProvider)).toBe(false);
    });
  });

  describe('isValueProvider', () => {
    it('should return true for a value provider', () => {
      const provider: Provider = { useValue: 'test' };
      expect(isValueProvider(provider)).toBe(true);
    });

    it('should return false for class or factory providers', () => {
      const classProvider: Provider = { useClass: class Test {} };
      const factProvider: Provider = { useFactory: () => 'test' };
      expect(isValueProvider(classProvider)).toBe(false);
      expect(isValueProvider(factProvider)).toBe(false);
    });
  });
});

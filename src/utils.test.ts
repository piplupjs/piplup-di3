import { describe, it, expect } from '../test/setup.js';
import { isClass, getClassName } from './utils.js';

describe('Utils Tests', () => {
  describe('isClass', () => {
    it('should return true for an ES6 class', () => {
      class TestClass {}
      expect(isClass(TestClass)).toBe(true);
    });

    it('should return true for a classic constructor function', () => {
      function TestConstructor(this: any) {
        this.value = 1;
      }
      TestConstructor.prototype.constructor = TestConstructor;
      expect(isClass(TestConstructor)).toBe(true);
    });

    it('should return true for constructable regular functions (treated as ES5 classes)', () => {
      function regularFunc() {}
      expect(isClass(regularFunc)).toBe(true);
    });

    it('should return false for non-constructable arrow functions', () => {
      const arrowFunc = () => {};
      expect(isClass(arrowFunc)).toBe(false);
    });

    it('should return false for primitive values, objects, arrays, null, and undefined', () => {
      expect(isClass({})).toBe(false);
      expect(isClass([])).toBe(false);
      expect(isClass('string')).toBe(false);
      expect(isClass(123)).toBe(false);
      expect(isClass(true)).toBe(false);
      expect(isClass(null)).toBe(false);
      expect(isClass(undefined)).toBe(false);
    });
  });

  describe('getClassName', () => {
    it('should return the constructor name of a class instance', () => {
      class LoggerService {}
      const logger = new LoggerService();
      expect(getClassName(logger)).toBe('LoggerService');
    });

    it('should return the name for regular objects', () => {
      expect(getClassName({})).toBe('Object');
    });

    it('should return UnknownClass for objects without a constructor', () => {
      const obj = Object.create(null);
      expect(getClassName(obj)).toBe('UnknownClass');
    });

    it('should return UnknownClass for objects with non-function constructor properties', () => {
      const obj = { constructor: 'not a function' as any };
      expect(getClassName(obj)).toBe('UnknownClass');
    });
  });
});

import { Constructor } from './types.js';

/**
 * Helper to identify if a token is a Class Constructor.
 * Handles native ES6 classes reliably by examining string representation
 * and fallback checks for prototype identity.
 */
export function isClass(v: any): v is Constructor {
  if (typeof v !== 'function') return false;

  // ES6 classes string representation starts with "class "
  const stringVal = Function.prototype.toString.call(v);
  if (stringVal.startsWith('class ')) {
    return true;
  }

  // Fallback for transpiled ES5 classes / constructor functions
  return !!v.prototype && v.prototype.constructor === v;
}

/**
 * Helper to retrieve the class constructor name safely without type assertions.
 */
export function getClassName(instance: object): string {
  if ('constructor' in instance && typeof instance.constructor === 'function') {
    return instance.constructor.name;
  }
  return 'UnknownClass';
}

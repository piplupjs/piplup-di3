import { InjectionToken } from './types.js';

export class ProviderNotFoundError extends Error {
  constructor(token: InjectionToken) {
    super(`No provider registered for "${String(token)}".`);
  }
}

export class DuplicateProviderError extends Error {
  constructor(token: InjectionToken) {
    super(`Provider already registered for "${String(token)}".`);
  }
}

export class FrozenContainerError extends Error {
  constructor() {
    super('Container is frozen and no longer accepts registrations.');
  }
}

export class CircularDependencyError extends Error {
  constructor(token: InjectionToken) {
    super(`Circular dependency detected while resolving "${String(token)}".`);
  }
}

export class InvalidProviderError extends Error {
  constructor(token: InjectionToken) {
    super(`Invalid provider for "${String(token)}".`);
  }
}

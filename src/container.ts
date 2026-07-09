import { InjectionToken, Constructor, FactoryProvider } from './types.js';
import { isClass } from './utils.js';

/**
 * Dependency Injection Container.
 * Lazily creates and caches singleton instances.
 */
class Container {
  private instances = new Map<any, any>();

  /**
   * Resolves an InjectionToken to its cached singleton instance.
   */
  get<T>(token: InjectionToken<T>): T {
    if (this.instances.has(token)) {
      return this.instances.get(token);
    }

    let resolvedValue: T;
    if (isClass(token)) {
      resolvedValue = new (token as Constructor<T>)();
    } else if (token && typeof token === 'object' && 'useFactory' in token) {
      resolvedValue = (token as FactoryProvider<T>).useFactory();
    } else {
      throw new Error(
        'Unsupported injection token. Must be a class constructor or a factory provider object.'
      );
    }

    this.instances.set(token, resolvedValue);
    return resolvedValue;
  }
}

// Export the single container instance.
export const container = new Container();

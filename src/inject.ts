import { container } from './container.js';
import { InjectionToken } from './types.js';
import { getClassName } from './utils.js';

/**
 * @Inject Decorator.
 *
 * Target: Must be applied to accessor properties only.
 * Restricts reassignment and default value initializations to guarantee dependency immutability.
 * Resolves dependencies lazily upon first access, delegating cache management to the container.
 */
export function Inject<T>(token: InjectionToken<T>) {
  return function <This extends object>(
    _: ClassAccessorDecoratorTarget<This, T>,
    context: ClassAccessorDecoratorContext<This, T>
  ): ClassAccessorDecoratorResult<This, T> | void {
    if (context.kind !== 'accessor') {
      throw new Error(
        `@Inject can only be used on accessor properties. ` +
          `Attempted to use @Inject on a "${context.kind}" named "${String(context.name)}".`
      );
    }

    return {
      get(this: This): T {
        // Lazily resolve from the singleton container cache directly
        return container.get(token);
      },

      set(this: This, _value: T) {
        throw new Error(
          `Dependency Injection Violation: Cannot reassign read-only injected property "${String(context.name)}" ` +
            `on instance of "${getClassName(this)}".`
        );
      },

      init(this: This, value: T): T {
        // Prevent default initialization (e.g. accessor prop = value;)
        if (value !== undefined) {
          throw new Error(
            `Dependency Injection Violation: Cannot initialize injected property "${String(context.name)}" ` +
              `on class "${getClassName(this)}" with a default value. Injected properties must be read-only and resolved from the Container.`
          );
        }
        return value;
      }
    };
  };
}

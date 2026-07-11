import { container } from './container.js';
import type { InjectionToken } from './types.js';

/**
 * Injects a dependency from the container.
 *
 * Supports only Stage 3 auto-accessors:
 *
 * class UserService {
 *   @Inject(Logger)
 *   readonly accessor logger!: Logger;
 * }
 */
export function Inject<T>(token: InjectionToken<T>) {
  return function (
    _target: ClassAccessorDecoratorTarget<any, T>,
    context: ClassAccessorDecoratorContext<any, T>
  ): ClassAccessorDecoratorResult<any, T> {
    if (context.kind !== 'accessor') {
      throw new TypeError('@Inject can only be applied to accessor properties.');
    }

    if (context.private) {
      throw new TypeError('@Inject cannot be applied to private accessors.');
    }

    return {
      get() {
        return container.get(token);
      },

      set() {
        throw new TypeError(`Cannot assign to injected dependency "${String(context.name)}".`);
      },

      init(initialValue) {
        if (initialValue !== undefined) {
          throw new TypeError(
            `Injected dependency "${String(context.name)}" cannot have a default value.`
          );
        }

        return initialValue;
      }
    };
  };
}

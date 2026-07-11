import {
  CircularDependencyError,
  DuplicateProviderError,
  FrozenContainerError,
  InvalidProviderError,
  ProviderNotFoundError
} from './errors.js';
import type { InjectionToken, Provider } from './types.js';
import { isClassProvider, isFactoryProvider, isValueProvider } from './utils.js';

type RegisterOptions = {
  override?: boolean;
};

type RegisteredProvider<T = unknown> = {
  resolve(): T;
};

export class Container {
  private readonly providers = new Map<InjectionToken, RegisteredProvider>();
  private readonly instances = new Map<InjectionToken, unknown>();
  private readonly resolving = new Set<InjectionToken>();

  private frozen = false;

  register<T>(
    token: InjectionToken<T>,
    provider: Provider<T>,
    options: RegisterOptions = {}
  ): void {
    if (this.frozen) {
      throw new FrozenContainerError();
    }

    if (!options.override && this.providers.has(token)) {
      throw new DuplicateProviderError(token);
    }

    let registered: RegisteredProvider<T>;

    if (isClassProvider(provider)) {
      registered = {
        resolve: () => new provider.useClass()
      };
    } else if (isFactoryProvider(provider)) {
      registered = {
        resolve: provider.useFactory
      };
    } else if (isValueProvider(provider)) {
      registered = {
        resolve: () => provider.useValue
      };
    } else {
      throw new InvalidProviderError(token);
    }

    this.providers.set(token, registered);
    this.instances.delete(token);
  }

  get<T>(token: InjectionToken<T>): T {
    const cached = this.instances.get(token);

    if (cached !== undefined || this.instances.has(token)) {
      return cached as T;
    }

    const provider = this.providers.get(token);

    if (!provider) {
      throw new ProviderNotFoundError(token);
    }

    if (this.resolving.has(token)) {
      throw new CircularDependencyError(token);
    }

    this.resolving.add(token);

    try {
      const instance = provider.resolve();

      this.instances.set(token, instance);

      return instance as T;
    } finally {
      this.resolving.delete(token);
    }
  }

  freeze(): void {
    this.frozen = true;
  }

  clear(): void {
    this.instances.clear();
  }

  dispose(): void {
    for (const instance of this.instances.values()) {
      if (instance && typeof instance === 'object') {
        if (Symbol.dispose in instance) {
          (instance as Disposable)[Symbol.dispose]();
        } else if ('dispose' in instance && typeof instance.dispose === 'function') {
          instance.dispose();
        }
      }
    }

    this.providers.clear();
    this.instances.clear();
    this.resolving.clear();
    this.frozen = false;
  }
}

export const container = new Container();

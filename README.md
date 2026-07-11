# @piplup/di3

A simple, lightweight, and type-safe dependency injection (DI) library for TypeScript and JavaScript, built on the standard ECMAScript Stage 3 decorators proposal.

## Features

- **Stage 3 Decorators**: Leverages native JavaScript/TypeScript class accessor decorators (no legacy `experimentalDecorators` or `emitDecoratorMetadata` required). Read more on the [TC39 Decorators Proposal](https://github.com/tc39/proposal-decorators).
- **Multiple Provider Types**: Supports Class Providers (`useClass`), Factory Providers (`useFactory`), and Value Providers (`useValue`).
- **Flexible Injection Tokens**: Use class constructors, symbols, or strings as injection tokens.
- **Lazy Resolution**: Dependencies are resolved from the container only upon first property access.
- **Circular Dependency Detection**: Detects circular dependencies at runtime and throws clear errors.
- **Explicit Registrations**: Avoids magic resolutions by requiring explicit provider registrations.
- **Container Lifecycle Management**: Easily freeze registrations, clear instance caches, or dispose of instances (supporting resource clean-up via `Symbol.dispose` or `dispose()`).

---

## Installation

Install `@piplup/di3` using your preferred package manager:

```bash
# pnpm
pnpm add @piplup/di3

# npm
npm install @piplup/di3

# yarn
yarn add @piplup/di3

# bun
bun add @piplup/di3
```

---

## Requirements

- **Node.js**: `>= 18.0.0`
- **TypeScript**: `>= 5.0.0` (configured with standard Stage 3 decorators)

---

## Quick Start

Below is a minimal working example showing how to register, inject, and resolve dependencies:

```typescript
import { container, Inject } from '@piplup/di3';

// 1. Define classes and injection tokens
class Logger {
  log(message: string) {
    console.log(`[LOG]: ${message}`);
  }
}

class UserService {
  // Inject dependency using the @Inject decorator on an accessor
  @Inject(Logger)
  accessor logger!: Logger;

  greet(name: string) {
    this.logger.log(`Hello, ${name}!`);
  }
}

// 2. Register providers in the container
container.register(Logger, { useClass: Logger });
container.register(UserService, { useClass: UserService });

// 3. Resolve and use
const userService = container.get(UserService);
userService.greet('World'); // Logs: [LOG]: Hello, World!
```

---

## Core Concepts

### 1. The Container

A central registry (`Container`) mapping `InjectionToken`s to `Provider` configurations. It maintains a singleton instance cache of all resolved dependencies.

- **Registration**: Explicitly map a token to a provider.
- **Resolution**: Retrieve a cached singleton instance via `container.get(token)`.
- **Freezing**: Prevent further registrations once bootstrapping is finished using `container.freeze()`.
- **Disposal**: Clear all registrations and invoke clean-up routines on active instances using `container.dispose()`.

### 2. `@Inject(token)` Decorator

Applied exclusively to class `accessor` properties. Under the hood, standard Stage 3 accessor decorators manage the target's lifecycle:

- **`get`**: Lazily resolves the dependency from the container and caches it upon first access.
- **`set`**: Prevents runtime reassignments by throwing a `TypeError`.
- **`init`**: Restricts default value initialization on the accessor to prevent bypassing the DI container.

### 3. Providers

`di3` supports three types of providers:

- **Class Provider**: Creates a new instance using the class constructor.
- **Factory Provider**: Executes a factory function to return a resolved value/instance.
- **Value Provider**: Directly injects a static value or pre-created instance.

---

## API Reference

### `Container` Methods

#### `container.register<T>(token, provider, options?)`

Registers a provider for the specified injection token.

- **Arguments**:
  - `token`: `InjectionToken<T>` (`Constructor<T> | symbol | string`)
  - `provider`: `Provider<T>` (one of `ClassProvider`, `FactoryProvider`, or `ValueProvider`)
  - `options?`: `RegisterOptions` (e.g. `{ override: true }` to override existing registration)
- **Throws**:
  - `FrozenContainerError`: If the container has been frozen.
  - `DuplicateProviderError`: If the token is already registered (unless `{ override: true }` is provided).
  - `InvalidProviderError`: If the provider shape is invalid.

#### `container.get<T>(token)`

Resolves the token and returns its cached singleton instance.

- **Arguments**:
  - `token`: `InjectionToken<T>`
- **Throws**:
  - `ProviderNotFoundError`: If no provider is registered for the token.
  - `CircularDependencyError`: If a circular dependency loop is detected during resolution.

#### `container.freeze()`

Freezes the container, preventing any further registrations.

#### `container.clear()`

Clears the singleton instances cache, forcing re-resolution on subsequent accesses.

#### `container.dispose()`

Disposes of all resolved singletons, clearing the cache and registrations, and resetting the frozen state. It calls `Symbol.dispose` or `dispose()` on any cached singleton that implements them.

---

### `@Inject(token)` Decorator

Annotates a class `accessor` property.

- **Arguments**:
  - `token`: `InjectionToken<T>`
- **Throws**:
  - `TypeError`: At runtime if applied to a non-accessor property (fields, methods), to a private accessor, or if initialized with a default value.

---

### Type Definitions

```typescript
type Constructor<T = any> = new (...args: any[]) => T;

type InjectionToken<T = unknown> = Constructor<T> | symbol | string;

type ClassProvider<T = unknown> = {
  useClass: Constructor<T>;
};

type FactoryProvider<T = unknown> = {
  useFactory(): T;
};

type ValueProvider<T = unknown> = {
  useValue: T;
};

type Provider<T = unknown> = ClassProvider<T> | FactoryProvider<T> | ValueProvider<T>;
```

---

## Advanced Usage

### Using Factory and Value Providers

You can register configuration settings or third-party client instances:

```typescript
import { container, Inject } from '@piplup/di3';

const API_URL_TOKEN = Symbol('ApiUrl');

// Value Provider
container.register(API_URL_TOKEN, { useValue: 'https://api.example.com' });

class ApiClient {
  @Inject(API_URL_TOKEN)
  accessor apiUrl!: string;

  fetchData() {
    return fetch(`${this.apiUrl}/data`);
  }
}

// Class Provider
container.register(ApiClient, { useClass: ApiClient });
```

### Resource Clean-up (Explicit Resource Management)

If a cached singleton implements `Symbol.dispose` or a `dispose()` method, `container.dispose()` will automatically call it:

```typescript
class DatabaseConnection {
  [Symbol.dispose]() {
    console.log('Database connection closed.');
  }
}

container.register(DatabaseConnection, { useClass: DatabaseConnection });
container.get(DatabaseConnection); // Instantiates and caches connection

container.dispose(); // Logs: "Database connection closed."
```

---

## TypeScript Configuration

`di3` requires TypeScript `5.0+` for Stage 3 decorators support.

Ensure `experimentalDecorators` is omitted or set to `false` in your `tsconfig.json` to prevent compiling using legacy decorators:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "experimentalDecorators": false
  }
}
```

Properties must use the `accessor` keyword:

```typescript
@Inject(MyService)
accessor service!: MyService;
```

---

## Testing & Contributing

### Run Tests

Tests are written with Vitest. Run all unit and E2E tests:

```bash
pnpm test
```

### Code Style & Linting

Check code quality and format rules:

```bash
pnpm lint
pnpm format
```

---

## License

This project is licensed under the Apache License, Version 2.0. See the [LICENSE](./LICENSE) file for details.

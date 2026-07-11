import { ClassProvider, FactoryProvider, Provider, ValueProvider } from './types.js';

export function isClassProvider<T>(provider: Provider<T>): provider is ClassProvider<T> {
  return 'useClass' in provider;
}

export function isFactoryProvider<T>(provider: Provider<T>): provider is FactoryProvider<T> {
  return 'useFactory' in provider;
}

export function isValueProvider<T>(provider: Provider<T>): provider is ValueProvider<T> {
  return 'useValue' in provider;
}

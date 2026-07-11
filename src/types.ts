export type Constructor<T = any> = new (...args: any[]) => T;

export type InjectionToken<T = unknown> = Constructor<T> | symbol | string;

export type ClassProvider<T = unknown> = {
  useClass: Constructor<T>;
};

export type FactoryProvider<T = unknown> = {
  useFactory(): T;
};

export type ValueProvider<T = unknown> = {
  useValue: T;
};

export type Provider<T = unknown> = ClassProvider<T> | FactoryProvider<T> | ValueProvider<T>;

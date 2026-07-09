export type Constructor<T = any> = new (...args: any[]) => T;

export type FactoryProvider<T = any> = {
  useFactory: () => T;
};

export type InjectionToken<T = any> = Constructor<T> | FactoryProvider<T>;

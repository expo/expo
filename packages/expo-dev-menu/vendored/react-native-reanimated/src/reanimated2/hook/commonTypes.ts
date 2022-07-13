export type DependencyList = Array<unknown> | undefined;

export type Context = Record<string, unknown>;

export interface ContextWithDependencies<TContext extends Context> {
  context: TContext;
  savedDependencies: DependencyList;
}
export interface Descriptor {
  tag: number;
  name: string;
}

export interface RefObjectFunction<T> {
  current: T | null;
  (component?: T): number;
}

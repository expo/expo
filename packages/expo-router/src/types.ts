// TODO: Use the global type
export interface RequireContext {
  /** Return the keys that can be resolved. */
  keys(): string[];
  (id: string): any;
  <T>(id: string): T;
  /** **Unimplemented:** Return the module identifier for a user request. */
  resolve(id: string): string;
  /** **Unimplemented:** Readable identifier for the context module. */
  id: string;
}

/** The list of input keys will become optional, everything else will remain the same. */
export type PickPartial<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type NativeIntent = {
  redirectSystemPath?: (event: { path: string; initial: boolean }) => Promise<string> | string;
};

export type * from './typed-routes/types';

declare module 'freeport-async' {
  interface FreePortOptions {
    hostnames?: Array<string | null>;
  }

  function freePortAsync(rangeStart: number, options?: FreePortOptions): Promise<number>;
  export = freePortAsync;
}

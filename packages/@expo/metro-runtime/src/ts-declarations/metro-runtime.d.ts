// TODO(@kitten): Used in `src/HMRClient.ts`; move to using `metro-runtime/modules/HMRClient` import
declare module 'metro-runtime/src/modules/HMRClient' {
  // NOTE(@kitten): These are inexact types, but we're just trying to vaguely match for now
  class HMRClient {
    constructor(uri: string);

    send(msg: string): void;
    isEnabled(): boolean;
    disable(): void;
    enable(): void;
    close(): void;
    hasPendingUpdates(): boolean;

    on(name: 'connection-error', onEvent: (error: Error) => unknown): void;
    on(name: 'update-start', onEvent: (event: { isInitialUpdate?: boolean }) => unknown): void;
    on(name: 'update', onEvent: (event: { isInitialUpdate?: boolean }) => unknown): void;
    on(name: 'update-done', onEvent: (event: unknown) => unknown): void;
    on(name: 'error', onEvent: (event: { type: string; message: string }) => unknown): void;
    on(name: 'close', onEvent: (event: { code: number; reason: string }) => unknown): void;
  }
  export = HMRClient;
}

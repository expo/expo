import { createDevServerMiddleware as originalCreate } from '@expo/dev-server';

export function createDevServerMiddleware(
  projectRoot: string,
  {
    watchFolders,
    port,
  }: {
    watchFolders: readonly string[];
    port: number;
  }
) {
  const shim = function () {};

  return originalCreate(projectRoot, {
    // Attach a fake logger to the expo `/logs` middleware so we can collect devices for analytics.
    // We utilize the WebSocket logs now so we don't need to print anything.
    // TODO: Migrate to a system that uses WebSockets so we can detect when a device disconnects.
    logger: {
      info: shim,
      warn: shim,
      error: shim,
      debug: shim,
    } as any,
    port,
    watchFolders,
  });
}

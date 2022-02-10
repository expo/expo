import { createDevServerMiddleware as originalCreate } from '@expo/dev-server';

import StatusEventEmitter from '../../../utils/analytics/StatusEventEmitter';

export function createDevServerMiddleware({
  watchFolders,
  port,
}: {
  watchFolders: readonly string[];
  port: number;
}) {
  const collectDevice = (info) => {
    if (info.tag === 'device') {
      StatusEventEmitter.emit('deviceLogReceive', {
        deviceId: info.deviceId,
        deviceName: info.deviceName,
      });
    }
  };

  return originalCreate({
    // Attach a fake logger to the expo `/logs` middleware so we can collect devices for analytics.
    // We utilize the WebSocket logs now so we don't need to print anything.
    // TODO: Migrate to a system that uses WebSockets so we can detect when a device disconnects.
    logger: {
      info: collectDevice,
      warn: collectDevice,
      error: collectDevice,
      debug: collectDevice,
    } as any,
    port,
    watchFolders,
  });
}

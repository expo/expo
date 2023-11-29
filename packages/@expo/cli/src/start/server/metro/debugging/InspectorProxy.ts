import type { unstable_InspectorProxy, unstable_Device } from '@react-native/dev-middleware';
import url from 'url';
import WS from 'ws';

const debug = require('debug')('expo:metro:inspector-proxy:proxy') as typeof console.log;

/** Web socket error code for unknown internal errors */
const INTERNAL_ERROR_CODE = 1011;

/**
 * Create a new Expo proxy inspector class that uses the feature-extended device class.
 * Everything else is reused from the original class.
 *
 * @see https://github.com/facebook/react-native/blob/f1df4ceb8479a6fc9c30f7571f5aeec255b116d2/packages/dev-middleware/src/inspector-proxy/InspectorProxy.js
 */
export function createInspectorProxyClass(
  MetroInspectorProxyClass: typeof unstable_InspectorProxy,
  MetroDeviceClass: typeof unstable_Device
): typeof unstable_InspectorProxy {
  return class ExpoInspectorProxy extends MetroInspectorProxyClass {
    _createDeviceConnectionWSServer() {
      const wss = new WS.Server({
        noServer: true,
        perMessageDeflate: true,
        // Don't crash on exceptionally large messages - assume the device is
        // well-behaved and the debugger is prepared to handle large messages.
        maxPayload: 0,
      });
      wss.on('connection', async (socket: WS, req) => {
        try {
          const fallbackDeviceId = String(this._deviceCounter++);

          const query = url.parse(req.url || '', true).query || {};
          const deviceId = asString(query.device) || fallbackDeviceId;
          const deviceName = asString(query.name) || 'Unknown';
          const appName = asString(query.app) || 'Unknown';

          const oldDevice = this._devices.get(deviceId);
          const newDevice = new MetroDeviceClass(
            deviceId,
            deviceName,
            appName,
            socket,
            this._projectRoot,
            this._eventReporter
          );

          if (oldDevice) {
            oldDevice.handleDuplicateDeviceConnection(newDevice);
          }

          this._devices.set(deviceId, newDevice);

          debug(`Got new connection: name=${deviceName}, app=${appName}, device=${deviceId}`);

          socket.on('close', () => {
            this._devices.delete(deviceId);
            debug(`Device ${deviceName} disconnected.`);
          });
        } catch (e) {
          console.error('error', e);
          socket.close(INTERNAL_ERROR_CODE, e?.toString() ?? 'Unknown error');
        }
      });
      return wss;
    }
  };
}

/** Convert the query paramters to plain string */
function asString(value: string | string[] = ''): string {
  return Array.isArray(value) ? value.join() : value;
}

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
    /**
     * This method is overwritten to inject our own device class.
     * @see https://github.com/facebook/react-native/blob/f1df4ceb8479a6fc9c30f7571f5aeec255b116d2/packages/dev-middleware/src/inspector-proxy/InspectorProxy.js#L179-L227
     */
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
          // @ts-expect-error until we sort out an issue with private members
          const fallbackDeviceId = String(this._deviceCounter++);

          const query = url.parse(req.url || '', true).query || {};
          const deviceId = asString(query.device) || fallbackDeviceId;
          const deviceName = asString(query.name) || 'Unknown';
          const appName = asString(query.app) || 'Unknown';

          // @ts-expect-error until we sort out an issue with private members
          const oldDevice = this._devices.get(deviceId);
          // FIX: Create a new device instance using our own extended class
          const newDevice = new MetroDeviceClass(
            deviceId,
            deviceName,
            appName,
            socket,
            // @ts-expect-error until we sort out an issue with private members
            this._projectRoot,
            // @ts-expect-error until we sort out an issue with private members
            this._eventReporter
          );

          if (oldDevice) {
            oldDevice.handleDuplicateDeviceConnection(newDevice);
          }

          // @ts-expect-error until we sort out an issue with private members
          this._devices.set(deviceId, newDevice);

          debug(`Got new connection: name=${deviceName}, app=${appName}, device=${deviceId}`);

          socket.on('close', () => {
            // FIX: Only clean up the device reference, if not replaced by new device
            // @ts-expect-error until we sort out an issue with private members
            if (this._devices.get(deviceId) === newDevice) {
              // @ts-expect-error until we sort out an issue with private members
              this._devices.delete(deviceId);
              debug(`Device ${deviceName} disconnected.`);
            } else {
              debug(`Device ${deviceName} reconnected.`);
            }
          });
        } catch (e) {
          console.error('error', e);
          socket.close(INTERNAL_ERROR_CODE, e?.toString() ?? 'Unknown error');
          // FIX: add missing event reporter
          // @ts-expect-error until we sort out an issue with private members
          this._eventReporter?.logEvent({
            type: 'connect_debugger_app',
            status: 'error',
            error: e,
          });
        }
      });

      return wss;
    }

    /**
     * This method is overwritten to allow user agents to be passed as query parameter.
     * The built-in debugger in vscode does not add any user agent headers.
     * @see https://github.com/facebook/react-native/blob/f1df4ceb8479a6fc9c30f7571f5aeec255b116d2/packages/dev-middleware/src/inspector-proxy/InspectorProxy.js#L234-L272
     */
    _createDebuggerConnectionWSServer() {
      const wss = new WS.Server({
        noServer: true,
        perMessageDeflate: false,
        // Don't crash on exceptionally large messages - assume the debugger is
        // well-behaved and the device is prepared to handle large messages.
        maxPayload: 0,
      });

      wss.on('connection', async (socket: WS, req) => {
        try {
          const query = url.parse(req.url || '', true).query || {};
          const deviceId = asString(query.device);
          const pageId = asString(query.page);
          // FIX: Determine the user agent from query paramter or header
          const userAgent = asString(query.userAgent) || req.headers['user-agent'] || null;

          if (deviceId == null || pageId == null) {
            throw new Error('Incorrect URL - must provide device and page IDs');
          }

          // @ts-expect-error until we sort out an issue with private members
          const device = this._devices.get(deviceId);
          if (device == null) {
            throw new Error('Unknown device with ID ' + deviceId);
          }

          device.handleDebuggerConnection(socket, pageId, { userAgent });
        } catch (e) {
          console.error(e);
          socket.close(INTERNAL_ERROR_CODE, e?.toString() ?? 'Unknown error');
          // @ts-expect-error until we sort out an issue with private members
          this._eventReporter?.logEvent({
            type: 'connect_debugger_frontend',
            status: 'error',
            error: e,
          });
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

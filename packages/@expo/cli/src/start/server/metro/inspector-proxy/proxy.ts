import type {
  unstable_Device as MetroDevice,
  unstable_InspectorProxy as MetroProxy,
} from '@react-native/dev-middleware';
import type { Server as HttpServer, IncomingMessage, ServerResponse } from 'http';
import type { Server as HttpsServer } from 'https';
import { parse } from 'url';
import WS, { Server as WSServer } from 'ws';

import { Log } from '../../../../log';

const WS_DEVICE_URL = '/inspector/device';
const WS_DEBUGGER_URL = '/inspector/debug';
const WS_GENERIC_ERROR_STATUS = 1011;

const debug = require('debug')('expo:metro:inspector-proxy:proxy') as typeof console.log;

// This is a workaround for `ConstructorType` not working on dynamically generated classes
type Instantiatable<Instance> = new (...args: any) => Instance;

export class ExpoInspectorProxy<D extends MetroDevice = MetroDevice> {
  constructor(
    public readonly metroProxy: MetroProxy,
    private DeviceClass: Instantiatable<D>,
    public readonly devices: Map<string, D> = new Map()
  ) {
    // monkey-patch the device list to expose it within the metro inspector
    // See https://github.com/facebook/metro/pull/991
    // @ts-expect-error - Device ID is changing from `number` to `string`
    this.metroProxy._devices = this.devices;

    // force httpEndpointMiddleware to be bound to this proxy instance
    this.processRequest = this.processRequest.bind(this);
  }

  /**
   * Normalize the server address for clients to connect to.
   * @param addressInfo the server address returned by `HttpServer.address()` or `HttpsServer.address()`.
   * @returns "address:port"
   */
  public static normalizeServerAddress(addressInfo: ReturnType<HttpServer['address']>): string {
    if (typeof addressInfo === 'string') {
      throw new Error(`Inspector proxy could not resolve the server address, got "${addressInfo}"`);
    } else if (addressInfo === null) {
      throw new Error(`Inspector proxy could not resolve the server address, got "null"`);
    }

    let address = addressInfo.address;
    if (addressInfo.family === 'IPv6') {
      address = address === '::' ? `[::1]` : `[${address}]`;
    } else {
      address = address === '0.0.0.0' ? 'localhost' : address;
    }
    return `${address}:${addressInfo.port}`;
  }

  /** @see https://chromedevtools.github.io/devtools-protocol/#endpoints */
  public processRequest(
    req: IncomingMessage,
    res: ServerResponse,
    next: (error?: Error | null) => any
  ) {
    this.metroProxy.processRequest(req, res, next);
  }

  public createWebSocketListeners(server: HttpServer | HttpsServer): Record<string, WSServer> {
    // Initialize the server address from the metro server.
    // This is required to properly reference sourcemaps for the debugger.
    this.metroProxy._serverAddressWithPort = ExpoInspectorProxy.normalizeServerAddress(
      server.address()
    );

    return {
      [WS_DEVICE_URL]: this.createDeviceWebSocketServer(),
      [WS_DEBUGGER_URL]: this.createDebuggerWebSocketServer(),
    };
  }

  private createDeviceWebSocketServer() {
    const wss = new WS.Server({
      noServer: true,
      perMessageDeflate: false,
    });

    // See: https://github.com/facebook/metro/blob/eeb211fdcfdcb9e7f8a51721bd0f48bc7d0d211f/packages/metro-inspector-proxy/src/InspectorProxy.js#L157
    wss.on('connection', (socket, request) => {
      try {
        const fallbackDeviceId = String(this.metroProxy._deviceCounter++);
        const { deviceId: newDeviceId, deviceName, appName } = getDeviceInfo(request.url);

        const deviceId = newDeviceId ?? fallbackDeviceId;

        const oldDevice = this.devices.get(deviceId);
        const newDevice = new this.DeviceClass(
          deviceId,
          deviceName,
          appName,
          socket,
          this.metroProxy._projectRoot
        );

        if (oldDevice) {
          debug('Device reconnected: device=%s, app=%s, id=%s', deviceName, appName, deviceId);
          // See: https://github.com/facebook/metro/pull/991
          // @ts-expect-error - Newly introduced method coming to @react-native/dev-middleware soon
          oldDevice.handleDuplicateDeviceConnection(newDevice);
        } else {
          debug('New device connected: device=%s, app=%s, id=%s', deviceName, appName, deviceId);
        }

        this.devices.set(deviceId, newDevice);

        socket.on('close', () => {
          if (this.devices.get(deviceId) === newDevice) {
            this.devices.delete(deviceId);
            debug('Device disconnected: device=%s, app=%s, id=%s', deviceName, appName, deviceId);
          }
        });
      } catch (error: unknown) {
        let message = '';

        debug('Could not establish a connection to on-device debugger:', error);

        if (error instanceof Error) {
          message = error.toString();
          Log.error('Failed to create a socket connection to on-device debugger (Hermes engine).');
          Log.exception(error);
        } else {
          Log.error(
            'Failed to create a socket connection to on-device debugger (Hermes engine), unknown error.'
          );
        }

        socket.close(WS_GENERIC_ERROR_STATUS, message || 'Unknown error');
      }
    });

    return wss;
  }

  private createDebuggerWebSocketServer() {
    const wss = new WS.Server({
      noServer: true,
      perMessageDeflate: false,
    });

    // See: https://github.com/facebook/metro/blob/eeb211fdcfdcb9e7f8a51721bd0f48bc7d0d211f/packages/metro-inspector-proxy/src/InspectorProxy.js#L193
    wss.on('connection', (socket, request) => {
      try {
        const { deviceId, pageId, debuggerType } = getDebuggerInfo(request.url);
        if (!deviceId || !pageId) {
          // TODO(cedric): change these errors to proper error types
          throw new Error(`Missing "device" and/or "page" IDs in query parameters`);
        }

        const device = this.devices.get(deviceId);
        if (!device) {
          // TODO(cedric): change these errors to proper error types
          throw new Error(`Device with ID "${deviceId}" not found.`);
        }

        debug('New debugger connected: device=%s, app=%s', device._name, device._app);

        // @ts-expect-error The `handleDebuggerConnectionWithType` is part of our device implementation, not Metro's device
        if (debuggerType && typeof device.handleDebuggerConnectionWithType === 'function') {
          // @ts-expect-error The `handleDebuggerConnectionWithType` is part of our device implementation, not Metro's device
          device.handleDebuggerConnectionWithType(socket, pageId, debuggerType);
        } else {
          device.handleDebuggerConnection(socket, pageId);
        }

        socket.on('close', () => {
          debug('Debugger disconnected: device=%s, app=%s', device._name, device._app);
        });
      } catch (error: unknown) {
        let message = '';

        debug('Could not establish a connection to debugger:', error);

        if (error instanceof Error) {
          message = error.toString();
          Log.error('Failed to create a socket connection to the debugger.');
          Log.exception(error);
        } else {
          Log.error('Failed to create a socket connection to the debugger, unkown error.');
        }

        socket.close(WS_GENERIC_ERROR_STATUS, message || 'Unknown error');
      }
    });

    return wss;
  }
}

function asString(value: string | string[] = ''): string {
  return Array.isArray(value) ? value.join() : value;
}

function getDeviceInfo(url: IncomingMessage['url']) {
  const { query } = parse(url ?? '', true);
  return {
    deviceId: asString(query.device) || undefined,
    deviceName: asString(query.name) || 'Unknown device name',
    appName: asString(query.app) || 'Unknown app name',
  };
}

function getDebuggerInfo(url: IncomingMessage['url']) {
  const { query } = parse(url ?? '', true);
  return {
    deviceId: asString(query.device),
    pageId: asString(query.page),
    debuggerType: asString(query.type) ?? undefined,
  };
}

import type { IncomingMessage, ServerResponse } from 'http';
import type { InspectorProxy as MetroProxy, Device as MetroDevice } from 'metro-inspector-proxy';
import type { AddressInfo } from 'net';
import { parse } from 'url';
import type { Server as WSServer } from 'ws';

import { importMetroInspectorWebSocketFromProject } from '../resolveFromProject';

const WS_DEVICE_URL = '/inspector/device';
const WS_DEBUGGER_URL = '/inspector/debug';
const WS_GENERIC_ERROR_STATUS = 1011;

const debug = require('debug')('expo:metro:inspector-proxy:proxy') as typeof console.log;

// This is a workaround for `ConstructorType` not working on dynamically generated classes
type Instantiatable<Instance> = new (...args: any) => Instance;

export class ExpoInspectorProxy<D extends MetroDevice> {
  constructor(
    public readonly metroProxy: MetroProxy,
    private DeviceClass: Instantiatable<D>,
    public readonly devices: Map<number, D> = new Map()
  ) {
    this.metroProxy = metroProxy;
    // monkey-patch the device list to expose it within the metro inspector
    this.metroProxy._devices = this.devices;

    // force httpEndpointMiddleware to be bound to this proxy instance
    this.httpEndpointMiddleware = this.httpEndpointMiddleware.bind(this);
  }

  public setServerAddress({ port, family }: Pick<AddressInfo, 'port' | 'family'>) {
    if (family === 'IPv6') {
      this.metroProxy._serverAddressWithPort = `[::1]:${port}`;
    } else {
      this.metroProxy._serverAddressWithPort = `localhost:${port}`;
    }
  }

  /** @see https://chromedevtools.github.io/devtools-protocol/#endpoints */
  public httpEndpointMiddleware(
    req: IncomingMessage,
    res: ServerResponse,
    next: (error?: Error) => any
  ) {
    return this.metroProxy.processRequest(req, res, next);
  }

  public createWebSocketEndpoints(port = 1111): Record<string, WSServer> {
    // Auto-initialize the server address on a best-guess basis
    this.setServerAddress({ port, family: 'IPv4' });

    return {
      [WS_DEVICE_URL]: this.createDeviceWebSocketServer(),
      [WS_DEBUGGER_URL]: this.createDebuggerWebSocketServer(),
    };
  }

  private createDeviceWebSocketServer() {
    const WS = importMetroInspectorWebSocketFromProject(this.metroProxy._projectRoot);
    const wss = new WS.Server({
      noServer: true,
      perMessageDeflate: false,
    });

    // See: https://github.com/facebook/metro/blob/eeb211fdcfdcb9e7f8a51721bd0f48bc7d0d211f/packages/metro-inspector-proxy/src/InspectorProxy.js#L157
    wss.on('connection', (socket, request) => {
      try {
        const deviceId = this.metroProxy._deviceCounter++;
        const { deviceName, appName } = getNewDeviceInfo(request.url);

        this.devices.set(
          deviceId,
          new this.DeviceClass(deviceId, deviceName, appName, socket, this.metroProxy._projectRoot)
        );

        debug('New device connected: device=%s, app=%s', deviceName, appName);

        socket.on('close', () => {
          this.devices.delete(deviceId);
          debug('Device disconnected: device=%s, app=%s', deviceName, appName);
        });
      } catch (error: unknown) {
        const message = error instanceof Error && error.toString();
        console.error('Could not establish a connection to device:', error);
        socket.close(WS_GENERIC_ERROR_STATUS, message || 'Unknown error');
      }
    });

    return wss;
  }

  private createDebuggerWebSocketServer() {
    const WS = importMetroInspectorWebSocketFromProject(this.metroProxy._projectRoot);
    const wss = new WS.Server({
      noServer: true,
      perMessageDeflate: false,
    });

    // See: https://github.com/facebook/metro/blob/eeb211fdcfdcb9e7f8a51721bd0f48bc7d0d211f/packages/metro-inspector-proxy/src/InspectorProxy.js#L193
    wss.on('connection', (socket, request) => {
      try {
        const { deviceId, pageId } = getExistingDeviceInfo(request.url);
        if (!deviceId || !pageId) {
          throw new Error(`Missing "device" and/or "page" IDs in query parameters`);
        }

        const device = this.devices.get(parseInt(deviceId, 10));
        if (!device) {
          throw new Error(`Device with ID "${deviceId}" not found.`);
        }

        debug('New debugger connected: device=%s, app=%s', device._name, device._app);

        device.handleDebuggerConnection(socket, pageId);

        socket.on('close', () => {
          debug('Debugger disconnected: device=%s, app=%s', device._name, device._app);
        });
      } catch (error: unknown) {
        const message = error instanceof Error && error.toString();
        debug('Could not establish a connection to debugger:', error);
        socket.close(WS_GENERIC_ERROR_STATUS, message || 'Unknown error');
      }
    });

    return wss;
  }
}

function asString(value?: string | string[]) {
  return Array.isArray(value) ? value.join() : value;
}

function getNewDeviceInfo(url: IncomingMessage['url']) {
  const { query } = parse(url ?? '', true);
  return {
    deviceName: asString(query.name) || 'Unknown device name',
    appName: asString(query.app) || 'Unknown app name',
  };
}

function getExistingDeviceInfo(url: IncomingMessage['url']) {
  const { query } = parse(url ?? '', true);
  return {
    deviceId: asString(query.device),
    pageId: asString(query.page),
  };
}

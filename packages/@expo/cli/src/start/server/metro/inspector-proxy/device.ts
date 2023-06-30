import type { DebuggerInfo, Device as MetroDevice } from 'metro-inspector-proxy';
import fetch from 'node-fetch';
import type WS from 'ws';

import { MetroBundlerDevServer } from '../MetroBundlerDevServer';
import { DebuggerScriptSourceHandler } from './handlers/DebuggerScriptSource';
import { NetworkResponseHandler } from './handlers/NetworkResponse';
import { PageReloadHandler } from './handlers/PageReload';
import { VscodeCompatHandler } from './handlers/VscodeCompat';
import { VscodeDebuggerScriptParsedHandler } from './handlers/VscodeDebuggerScriptParsed';
import { DeviceRequest, InspectorHandler, DebuggerRequest } from './handlers/types';

const debug = require('debug')('expo:metro:inspector-proxy:device') as typeof console.log;

export function createInspectorDeviceClass(
  metroBundler: MetroBundlerDevServer,
  MetroDeviceClass: typeof MetroDevice
) {
  return class ExpoInspectorDevice extends MetroDeviceClass implements InspectorHandler {
    /** All handlers that should be used to intercept or reply to CDP events */
    public allHandlers: InspectorHandler[] = [
      // VS Code specific handlers
      new VscodeDebuggerScriptParsedHandler(this),
      new VscodeCompatHandler(),
      // Generic handlers for all debuggers
      new NetworkResponseHandler(),
      new DebuggerScriptSourceHandler(this),
      new PageReloadHandler(metroBundler),
    ];

    /** All (active) handlers based on the connected debugger type */
    public activeHandlers: InspectorHandler[] = this.allHandlers;

    onDeviceMessage(message: any, info: DebuggerInfo): boolean {
      return this.activeHandlers.some(
        (handler) => handler.onDeviceMessage?.(message, info) ?? false
      );
    }

    onDebuggerMessage(message: any, info: DebuggerInfo): boolean {
      return this.activeHandlers.some(
        (handler) => handler.onDebuggerMessage?.(message, info) ?? false
      );
    }

    /**
     * Handle a new device connection with the same device identifier.
     * When the app and device name matches, we can reuse the debugger connection.
     * Else, we have to shut the debugger connection down.
     */
    handleDuplicateDeviceConnection(newDevice: InstanceType<typeof MetroDeviceClass>) {
      if (this._app !== newDevice._app || this._name !== newDevice._name) {
        this._deviceSocket.close();
        this._debuggerConnection?.socket.close();
        return;
      }

      const oldDebugger = this._debuggerConnection;
      this._debuggerConnection = null;

      if (oldDebugger) {
        oldDebugger.socket.removeAllListeners();
        this._deviceSocket.close();
        newDevice.handleDebuggerConnection(oldDebugger.socket, oldDebugger.pageId);
      }
    }

    /** Hook into the message life cycle to answer more complex CDP messages */
    async _processMessageFromDevice(message: DeviceRequest<any>, info: DebuggerInfo) {
      if (!this.onDeviceMessage(message, info)) {
        await super._processMessageFromDevice(message, info);
      }
    }

    /** Hook into the message life cycle to answer more complex CDP messages */
    _interceptMessageFromDebugger(
      request: DebuggerRequest,
      info: DebuggerInfo,
      socket: WS
    ): boolean {
      // Note, `socket` is the exact same as `info.socket`
      if (this.onDebuggerMessage(request, info)) {
        return true;
      }

      return super._interceptMessageFromDebugger(request, info, socket);
    }

    /** Hook into the incoming debugger connection, which could change the current active handlers */
    handleDebuggerConnection(socket: WS, pageId: string, debuggerType?: string) {
      if (debuggerType) {
        this.activeHandlers = this.allHandlers.filter(
          (handler) => !handler.debuggerType || handler.debuggerType === debuggerType
        );
        debug('Enabled handlers for debugger: %s', debuggerType);
      } else {
        this.activeHandlers = this.allHandlers.filter((handler) => !handler.debuggerType);
        debug('Enabled generic handlers for debugger');
      }

      debug('Handlers enabled: %s', this.activeHandlers.map((h) => h.constructor.name).join(', '));

      super.handleDebuggerConnection(socket, pageId);
    }

    /**
     * Overwrite the default text fetcher, to load sourcemaps from sources other than `localhost`.
     * @todo Cedric: remove the custom `DebuggerScriptSource` handler when switching over to `metro@>=0.75.1`
     * @see https://github.com/facebook/metro/blob/77f445f1bcd2264ad06174dbf8d542bc75834d29/packages/metro-inspector-proxy/src/Device.js#L573-L588
     * @since metro-inspector-proxy@0.75.1
     */
    async _fetchText(url: URL): Promise<string> {
      const LENGTH_LIMIT_BYTES = 350_000_000; // 350mb

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Received status ${response.status} while fetching: ${url}`);
      }

      const contentLength = response.headers.get('Content-Length');
      if (contentLength && Number(contentLength) > LENGTH_LIMIT_BYTES) {
        throw new Error('Expected file size is too large (more than 350mb)');
      }

      const text = await response.text();
      if (Buffer.byteLength(text, 'utf8') > LENGTH_LIMIT_BYTES) {
        throw new Error('File size is too large (more than 350mb)');
      }

      return text;
    }
  };
}

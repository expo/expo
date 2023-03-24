import type { Server as MetroServer } from 'metro';
import type { DebuggerInfo, Device as MetroDevice } from 'metro-inspector-proxy';
import fetch from 'node-fetch';
import type WS from 'ws';

// import { DebuggerScriptSource } from './handlers/DebuggerScriptSource';
import { NetworkResponseHandler } from './handlers/NetworkResponse';
import { PageReloadHandler } from './handlers/PageReload';
import { VscodeCompatHandler } from './handlers/VscodeCompat';
import { DeviceRequest, InspectorHandler, DebuggerRequest } from './handlers/types';

export function createInspectorDeviceClass(metroServer: MetroServer, MetroDeviceClass: typeof MetroDevice) {
  return class ExpoInspectorDevice extends MetroDeviceClass implements InspectorHandler {
    /** All handlers that should be used to intercept or reply to CDP events */
    public handlers: InspectorHandler[] = [
      new NetworkResponseHandler(),
      // new DebuggerScriptSource(this),
      new VscodeCompatHandler(),
      new PageReloadHandler(metroServer),
    ];

    onDeviceMessage(message: any, info: DebuggerInfo): boolean {
      return this.handlers.some((handler) => handler.onDeviceMessage?.(message, info) ?? false);
    }

    onDebuggerMessage(message: any, info: DebuggerInfo): boolean {
      return this.handlers.some((handler) => handler.onDebuggerMessage?.(message, info) ?? false);
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

    /**
     * Overwrite the default text fetcher, to load sourcemaps from sources other than `localhost`.
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

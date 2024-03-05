import type { unstable_Device } from '@react-native/dev-middleware';
import fetch from 'node-fetch';
import type WS from 'ws';

import { NetworkResponseHandler } from './inspectorHandlers/NetworkResponse';
import { PageReloadHandler } from './inspectorHandlers/PageReload';
import { VscodeDebuggerGetPossibleBreakpointsHandler } from './inspectorHandlers/VscodeDebuggerGetPossibleBreakpoints';
import { VscodeDebuggerScriptParsedHandler } from './inspectorHandlers/VscodeDebuggerScriptParsed';
import { VscodeDebuggerSetBreakpointByUrlHandler } from './inspectorHandlers/VscodeDebuggerSetBreakpointByUrl';
import { VscodeRuntimeCallFunctionOnHandler } from './inspectorHandlers/VscodeRuntimeCallFunctionOn';
import { VscodeRuntimeGetPropertiesHandler } from './inspectorHandlers/VscodeRuntimeGetProperties';
import { DebuggerMetadata, DeviceRequest, InspectorHandler } from './inspectorHandlers/types';
import { type MetroBundlerDevServer } from '../MetroBundlerDevServer';

export function createInspectorDeviceClass(
  metroBundler: MetroBundlerDevServer,
  MetroDeviceClass: typeof unstable_Device
): typeof unstable_Device {
  return class ExpoInspectorDevice extends MetroDeviceClass implements InspectorHandler {
    /** All handlers that should be used to intercept or reply to CDP events */
    public handlers: InspectorHandler[] = [
      // Generic handlers
      new NetworkResponseHandler(),
      new PageReloadHandler(metroBundler),
      // Vscode-specific handlers
      new VscodeDebuggerGetPossibleBreakpointsHandler(),
      new VscodeDebuggerScriptParsedHandler(this),
      new VscodeDebuggerSetBreakpointByUrlHandler(),
      new VscodeRuntimeGetPropertiesHandler(),
      new VscodeRuntimeCallFunctionOnHandler(),
    ];

    onDeviceMessage(message: any, info: DebuggerMetadata): boolean {
      return this.handlers.some((handler) => handler.onDeviceMessage?.(message, info) ?? false);
    }

    onDebuggerMessage(message: any, info: DebuggerMetadata): boolean {
      return this.handlers.some((handler) => handler.onDebuggerMessage?.(message, info) ?? false);
    }

    /** Hook into the message life cycle to answer more complex CDP messages */
    async _processMessageFromDevice(message: DeviceRequest<any>, info: DebuggerMetadata) {
      if (!this.onDeviceMessage(message, info)) {
        // @ts-expect-error until we sort out an issue with private members
        await super._processMessageFromDevice(message, info);
      }
    }

    /** Hook into the message life cycle to answer more complex CDP messages */
    _interceptMessageFromDebugger(
      // @ts-expect-error until we sort out an issue with private members
      request: Parameters<unstable_Device['_interceptMessageFromDebugger']>[0],
      info: DebuggerMetadata,
      socket: WS
    ): boolean {
      // Note, `socket` is the exact same as `info.socket`
      if (this.onDebuggerMessage(request, info)) {
        return true;
      }
      // @ts-expect-error until we sort out an issue with private members
      return super._interceptMessageFromDebugger(request, info, socket);
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

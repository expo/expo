import type { Protocol } from 'devtools-protocol';
import { DebuggerInfo, Device as MetroDevice } from 'metro-inspector-proxy';

import { CdpMessage, DebuggerRequest, InspectorHandler } from './types';

/** Android's stock emulator and other emulators such as genymotion use a standard localhost alias. */
const EMULATOR_LOCALHOST_ADDRESSES: Readonly<string[]> = ['10.0.2.2', '10.0.3.2'];
/** Prefix for script URLs that are alphanumeric IDs. */
const FILE_PREFIX = 'file://';

/**
 * This source map handler overwrites behavior from `metro-inspector-proxy`.
 * In Metro, source maps are being downloaded and converted to an inline base64 string.
 * Unfortunately, this causes a huge delay when debugging through `vscode-expo`.
 *
 * @see https://github.com/facebook/metro/blob/f43caa371a813b257cb0b42028079645a1e85e0e/packages/metro-inspector-proxy/src/Device.js#L398C38-L454
 */
export class VscodeDebuggerScriptParsedHandler implements InspectorHandler {
  /** Only enable this handler for vscode debugging sessions */
  debuggerType = 'vscode' as const;

  constructor(private readonly device: MetroDevice) {}

  onDeviceMessage(
    message: DebuggerRequest<DebuggerScriptParsed>,
    debuggerInfo: Pick<DebuggerInfo, 'originalSourceURLAddress' | 'prependedFilePrefix'>
  ) {
    // Exit early if we aren't parsing a scripts
    if (message.method !== 'Debugger.scriptParsed') return false;

    // See: https://github.com/facebook/metro/blob/f43caa371a813b257cb0b42028079645a1e85e0e/packages/metro-inspector-proxy/src/Device.js#L401-L410
    if (message.params.sourceMapURL) {
      for (let i = 0; i < EMULATOR_LOCALHOST_ADDRESSES.length; ++i) {
        const address = EMULATOR_LOCALHOST_ADDRESSES[i];
        if (message.params.sourceMapURL.indexOf(address) >= 0) {
          message.params.sourceMapURL = message.params.sourceMapURL.replace(address, 'localhost');
          debuggerInfo.originalSourceURLAddress = address;
        }
      }
    }

    // See: https://github.com/facebook/metro/blob/f43caa371a813b257cb0b42028079645a1e85e0e/packages/metro-inspector-proxy/src/Device.js#L431-L453
    if (message.params.url) {
      for (let i = 0; i < EMULATOR_LOCALHOST_ADDRESSES.length; ++i) {
        const address = EMULATOR_LOCALHOST_ADDRESSES[i];
        if (message.params.url.indexOf(address) >= 0) {
          message.params.url = message.params.url.replace(address, 'localhost');
          debuggerInfo.originalSourceURLAddress = address;
        }
      }

      // Chrome doesn't download source maps if URL param is not a valid
      // URL. Some frameworks pass alphanumeric script ID instead of URL which causes
      // Chrome to not download source maps. In this case we want to prepend script ID
      // with 'file://' prefix.
      if (message.params.url.match(/^[0-9a-z]+$/)) {
        message.params.url = FILE_PREFIX + message.params.url;
        debuggerInfo.prependedFilePrefix = true;
      }

      if (message.params.scriptId != null) {
        this.device._scriptIdToSourcePathMapping.set(message.params.scriptId, message.params.url);
      }
    }

    // Block `metro-inspector-proxy`'s default sourcemap handling
    return true;
  }
}

/** @see https://chromedevtools.github.io/devtools-protocol/1-2/Page/#method-reload */
export type DebuggerScriptParsed = CdpMessage<
  'Debugger.scriptParsed',
  Protocol.Debugger.ScriptParsedEvent,
  never
>;

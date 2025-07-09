import type Protocol from 'devtools-protocol';

import { MessageHandler } from '../MessageHandler';
import { getDebuggerType } from '../getDebuggerType';
import type { CdpMessage, DebuggerRequest, DeviceResponse } from '../types';

/**
 * Vscode doesn't seem to work nicely with missing `description` fields on `RemoteObject` instances.
 * It also tries to invoke `Runtime.callFunctionOn` on `Symbol` types, which crashes Hermes.
 * This handler tries to compensate for these two separate issues.
 *
 * @see https://github.com/facebook/hermes/issues/114
 * @see https://github.com/microsoft/vscode-js-debug/issues/1583
 */
export class VscodeRuntimeGetPropertiesHandler extends MessageHandler {
  /** Keep track of `Runtime.getProperties` responses to intercept, by request id */
  interceptGetProperties = new Set<number>();

  isEnabled() {
    return getDebuggerType(this.debugger.userAgent) === 'vscode';
  }

  handleDebuggerMessage(message: DebuggerRequest<RuntimeGetProperties>) {
    if (message.method === 'Runtime.getProperties') {
      this.interceptGetProperties.add(message.id);
    }

    // Do not block propagation of this message
    return false;
  }

  handleDeviceMessage(message: DeviceResponse<RuntimeGetProperties>) {
    if ('id' in message && this.interceptGetProperties.has(message.id)) {
      this.interceptGetProperties.delete(message.id);

      for (const item of message.result.result ?? []) {
        // Force-fully format the properties description to be an empty string
        if (item.value) {
          item.value.description = item.value.description ?? '';
        }

        // Avoid passing the `objectId` for symbol types.
        // When collapsing in vscode, it will fetch information about the symbol using the `objectId`.
        // The `Runtime.getProperties` request of the symbol hard-crashes Hermes.
        if (item.value?.type === 'symbol' && item.value.objectId) {
          delete item.value.objectId;
        }
      }
    }

    // Do not block propagation of this message
    return false;
  }
}

/** @see https://chromedevtools.github.io/devtools-protocol/v8/Runtime/#method-getProperties */
export type RuntimeGetProperties = CdpMessage<
  'Runtime.getProperties',
  Protocol.Runtime.GetPropertiesRequest,
  Protocol.Runtime.GetPropertiesResponse
>;

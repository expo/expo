import Protocol from 'devtools-protocol';

import {
  CdpMessage,
  DebuggerMetadata,
  DebuggerRequest,
  DeviceResponse,
  InspectorHandler,
} from './types';
import { getDebuggerType, respond } from './utils';

/**
 * Vscode is trying to inject a script to fetch information about "Stringy" variables.
 * Unfortunately, this script causes a Hermes exception and crashes the app.
 *
 * @see https://github.com/expo/vscode-expo/issues/231
 * @see https://github.com/microsoft/vscode-js-debug/blob/dcccaf3972d675cc1e5c776450bb4c3dc8c178c1/src/adapter/stackTrace.ts#L319-L324
 */
export class VscodeRuntimeCallFunctionOnHandler implements InspectorHandler {
  onDebuggerMessage(
    message: DebuggerRequest<RuntimeCallFunctionOn>,
    { socket, userAgent }: DebuggerMetadata
  ): boolean {
    if (getDebuggerType(userAgent) === 'vscode' && message.method === 'Runtime.callFunctionOn') {
      return respond<DeviceResponse<RuntimeCallFunctionOn>>(socket, {
        id: message.id,
        result: {
          // We don't know the `type` and vscode allows `type: undefined`
          result: { objectId: message.params.objectId } as any,
        },
      });
    }

    return false;
  }
}

/** @see https://chromedevtools.github.io/devtools-protocol/v8/Runtime/#method-callFunctionOn */
export type RuntimeCallFunctionOn = CdpMessage<
  'Runtime.callFunctionOn',
  Protocol.Runtime.CallFunctionOnRequest,
  Protocol.Runtime.CallFunctionOnResponse
>;

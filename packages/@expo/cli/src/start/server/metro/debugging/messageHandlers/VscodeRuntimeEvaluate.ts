import type Protocol from 'devtools-protocol';

import { MessageHandler } from '../MessageHandler';
import { getDebuggerType } from '../getDebuggerType';
import type { CdpMessage, DebuggerRequest, DeviceResponse } from '../types';

/**
 * Vscode is trying to inject a script to configure Node environment variables.
 * This won't work in Hermes, but vscode will retry this 200x.
 * Avoid sending this "spam" to the device.
 *
 * @see https://github.com/microsoft/vscode-js-debug/blob/1d104b5184736677ab5cc280c70bbd227403850c/src/targets/node/nodeAttacherBase.ts#L22-L54
 */
export class VscodeRuntimeEvaluateHandler extends MessageHandler {
  isEnabled() {
    return getDebuggerType(this.debugger.userAgent) === 'vscode';
  }

  handleDebuggerMessage(message: DebuggerRequest<RuntimeEvaluate>) {
    if (message.method === 'Runtime.evaluate' && isVscodeNodeAttachEnvironmentInjection(message)) {
      return this.sendToDebugger<DeviceResponse<RuntimeEvaluate>>({
        id: message.id,
        result: {
          result: {
            type: 'string',
            value: `Hermes doesn't support environment variables through process.env`,
          },
        },
      });
    }

    if (message.method === 'Runtime.evaluate' && isVscodeNodeTelemetry(message)) {
      return this.sendToDebugger<DeviceResponse<RuntimeEvaluate>>({
        id: message.id,
        result: {
          result: {
            type: 'object',
            value: {
              processId: this.page.id,
              nodeVersion: process.version,
              architecture: process.arch,
            },
          },
        },
      });
    }

    return false;
  }
}

/** @see https://chromedevtools.github.io/devtools-protocol/v8/Runtime/#method-evaluate */
export type RuntimeEvaluate = CdpMessage<
  'Runtime.evaluate',
  Protocol.Runtime.EvaluateRequest,
  Protocol.Runtime.EvaluateResponse
>;

/** @see https://github.com/microsoft/vscode-js-debug/blob/1d104b5184736677ab5cc280c70bbd227403850c/src/targets/node/nodeAttacherBase.ts#L22-L54 */
function isVscodeNodeAttachEnvironmentInjection(message: DebuggerRequest<RuntimeEvaluate>) {
  return (
    message.params?.expression.includes(`typeof process==='undefined'`) &&
    message.params?.expression.includes(`'process not defined'`) &&
    message.params?.expression.includes(`process.env["NODE_OPTIONS"]`)
  );
}

/** @see https://github.com/microsoft/vscode-js-debug/blob/1d104b5184736677ab5cc280c70bbd227403850c/src/targets/node/nodeLauncherBase.ts#L523-L531 */
function isVscodeNodeTelemetry(message: DebuggerRequest<RuntimeEvaluate>) {
  return (
    message.params?.expression.includes(`typeof process === 'undefined'`) &&
    message.params?.expression.includes(`'process not defined'`) &&
    message.params?.expression.includes(`process.pid`) &&
    message.params?.expression.includes(`process.version`) &&
    message.params?.expression.includes(`process.arch`)
  );
}

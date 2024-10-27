import { mockConnection } from '../../__tests__/mockConnection';
import { getDebuggerType } from '../../getDebuggerType';
import type { DebuggerRequest } from '../../types';
import { type RuntimeEvaluate, VscodeRuntimeEvaluateHandler } from '../VscodeRuntimeEvaluate';

jest.mock('../../getDebuggerType', () => ({
  ...jest.requireActual('../../getDebuggerType'),
  getDebuggerType: jest.fn(() => 'unknown'),
}));

it('is enabled when debugger has vscode user agent', () => {
  jest.mocked(getDebuggerType).mockReturnValue('vscode');
  const handler = new VscodeRuntimeEvaluateHandler(mockConnection());
  expect(handler.isEnabled()).toBe(true);
});

it('is disabled when debugger doesnt have vscode user agent', () => {
  jest.mocked(getDebuggerType).mockReturnValue('unknown');
  const handler = new VscodeRuntimeEvaluateHandler(mockConnection());
  expect(handler.isEnabled()).toBe(false);
});

it('swallows `Runtime.evaluate` debugger message containing `process.env["NODE_OPTIONS"]`', () => {
  const connection = mockConnection();
  const handler = new VscodeRuntimeEvaluateHandler(connection);
  const message: DebuggerRequest<RuntimeEvaluate> = {
    id: 420,
    method: 'Runtime.evaluate',
    params: {
      contextId: 1,
      returnByValue: true,
      expression:
        // Copied from debugger logs
        'typeof process===\'undefined\'||process.pid===undefined?\'process not defined\':(()=>{process.env["NODE_OPTIONS"]=(process.env["NODE_OPTIONS"]||\'\')+" --require \\"/Applications/Visual Studio Code.app/Contents/Resources/app/extensions/ms-vscode.js-debug/src/bootloader.js\\" ";process.env["VSCODE_INSPECTOR_OPTIONS"]=(process.env["VSCODE_INSPECTOR_OPTIONS"]||\'\')+":::{\\"inspectorIpc\\":\\"/var/folders/qw/kq2qkfj10rs4zfbnt69l3fwr0000gn/T/node-cdp.18359-67ff231c-4.sock\\",\\"deferredMode\\":false,\\"waitForDebugger\\":\\"\\",\\"execPath\\":\\"/Users/cedric/.nvm/versions/node/v20.15.0/bin/node\\",\\"onlyEntrypoint\\":false,\\"verbose\\":true,\\"autoAttachMode\\":\\"always\\",\\"requireLease\\":\\"/var/folders/qw/kq2qkfj10rs4zfbnt69l3fwr0000gn/T/node-debug-callback-1260cf94f667f175\\",\\"openerId\\":\\"a7b168b6dd4c06780be0c3cc\\"}"})()\n//# sourceURL=eval-d021ace4.cdp\n',
    },
  };

  // Message should not be send to the device
  expect(handler.handleDebuggerMessage(message)).toBe(true);
  // Handler should respond with a helpful message
  expect(connection.debugger.sendMessage).toHaveBeenCalledWith(
    expect.objectContaining({
      id: 420,
      result: {
        result: {
          type: 'string',
          value: `Hermes doesn't support environment variables through process.env`,
        },
      },
    })
  );
});

it('handles `Runtime.evaluate` debugger message for Node telemetry', () => {
  const connection = mockConnection();
  const handler = new VscodeRuntimeEvaluateHandler(connection);
  // See https://github.com/microsoft/vscode-js-debug/blob/1d104b5184736677ab5cc280c70bbd227403850c/src/targets/node/nodeLauncherBase.ts#L523-L531
  const message: DebuggerRequest<RuntimeEvaluate> = {
    id: 420,
    method: 'Runtime.evaluate',
    params: {
      contextId: 1,
      returnByValue: true,
      expression:
        // Copied from debugger logs
        "typeof process === 'undefined' || process.pid === undefined ? 'process not defined' : ({ processId: process.pid, nodeVersion: process.version, architecture: process.arch })\n//# sourceURL=eval-c710df34.cdp\n",
    },
  };

  // Message should not be send to the device
  expect(handler.handleDebuggerMessage(message)).toBe(true);
  // Handler should respond with a helpful message
  expect(connection.debugger.sendMessage).toHaveBeenCalledWith(
    expect.objectContaining({
      id: 420,
      result: {
        result: {
          type: 'object',
          value: {
            processId: connection.page.id,
            nodeVersion: process.version,
            architecture: process.arch,
          },
        },
      },
    })
  );
});

it('does not swallow other `Runtime.evalute` debugger messages', () => {
  const connection = mockConnection();
  const handler = new VscodeRuntimeEvaluateHandler(connection);
  const message: DebuggerRequest<RuntimeEvaluate> = {
    id: 420,
    method: 'Runtime.evaluate',
    params: {
      expression: 'console.log("hello world")',
      returnByValue: true,
    },
  };

  // Message should not be send to the device
  expect(handler.handleDebuggerMessage(message)).toBe(false);
  // Handler should not respond
  expect(connection.debugger.sendMessage).not.toHaveBeenCalled();
});

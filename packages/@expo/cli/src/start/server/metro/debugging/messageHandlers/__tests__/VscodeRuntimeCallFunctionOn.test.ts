import { mockConnection } from './testUtilts';
import { getDebuggerType } from '../../getDebuggerType';
import type { DebuggerRequest } from '../../types';
import {
  type RuntimeCallFunctionOn,
  VscodeRuntimeCallFunctionOnHandler,
} from '../VscodeRuntimeCallFunctionOn';

jest.mock('../../getDebuggerType', () => ({
  ...jest.requireActual('../../getDebuggerType'),
  getDebuggerType: jest.fn(() => 'unknown'),
}));

it('is enabled when debugger has vscode user agent', () => {
  jest.mocked(getDebuggerType).mockReturnValue('vscode');
  const handler = new VscodeRuntimeCallFunctionOnHandler(mockConnection());
  expect(handler.isEnabled()).toBe(true);
});

it('is disabled when debugger doesnt have vscode user agent', () => {
  jest.mocked(getDebuggerType).mockReturnValue('unknown');
  const handler = new VscodeRuntimeCallFunctionOnHandler(mockConnection());
  expect(handler.isEnabled()).toBe(false);
});

it('swallows `Runtime.callFunctionOn` debugger message and responds with object ID pointer', () => {
  const connection = mockConnection();
  const handler = new VscodeRuntimeCallFunctionOnHandler(connection);

  // Message should NOT be sent to the device
  expect(handler.handleDebuggerMessage(callFunctionOnMessage)).toBe(true);
  // Handler should respond with object ID pointer
  expect(connection.debugger.sendMessage).toBeCalledWith(
    expect.objectContaining({
      id: 420,
      result: {
        result: {
          objectId: callFunctionOnMessage.params.objectId,
        },
      },
    })
  );
});

// Copied from the vscode trace logs
const callFunctionOnMessage: DebuggerRequest<RuntimeCallFunctionOn> = {
  id: 420,
  method: 'Runtime.callFunctionOn',
  params: {
    objectId: '1337',
    returnByValue: true,
    functionDeclaration:
      'function(...runtimeArgs){\n    let t = 64; let e = null;\n    if(e)try{let r="<<default preview>>",n=e.call(this,r);if(n!==r)return String(n)}catch(r){return`<<indescribable>>${JSON.stringify([String(r),"object"])}`}if(typeof this=="object"&&this){let r;for(let n of[Symbol.for("debug.description"),Symbol.for("nodejs.util.inspect.custom")])try{r=this[n]();break}catch{}if(!r&&!String(this.toString).includes("[native code]")&&(r=String(this)),r&&!r.startsWith("[object "))return r.length>=t?r.slice(0,t)+"\\u2026":r}\n  ;\n\n//# sourceURL=eval-0e67cb94.cdp\n}',
  },
};

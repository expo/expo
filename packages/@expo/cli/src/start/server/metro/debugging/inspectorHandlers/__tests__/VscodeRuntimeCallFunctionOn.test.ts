import {
  RuntimeCallFunctionOn,
  VscodeRuntimeCallFunctionOnHandler,
} from '../VscodeRuntimeCallFunctionOn';
import { DebuggerRequest } from '../types';
import { getDebuggerType } from '../utils';

jest.mock('../utils', () => ({
  ...jest.requireActual('../utils'),
  getDebuggerType: jest.fn(() => 'unknown'),
}));

it('does not respond on non-vscode debugger type', () => {
  const handler = new VscodeRuntimeCallFunctionOnHandler();
  const socket = { send: jest.fn() };

  // Message should be sent to the device
  expect(handler.onDebuggerMessage(callFunctionOnMessage, { socket })).toBe(false);
  // Handler should not respond
  expect(socket.send).not.toBeCalled();
});

it('swallows `Runtime.callFunctionOn` debugger message and responds with object ID pointer', () => {
  jest.mocked(getDebuggerType).mockReturnValue('vscode');

  const handler = new VscodeRuntimeCallFunctionOnHandler();
  const socket = { send: jest.fn() };

  // Message should NOT be sent to the device
  expect(handler.onDebuggerMessage(callFunctionOnMessage, { socket })).toBe(true);
  // Handler should respond with object ID pointer
  expect(socket.send).toBeCalledWith(
    JSON.stringify({
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

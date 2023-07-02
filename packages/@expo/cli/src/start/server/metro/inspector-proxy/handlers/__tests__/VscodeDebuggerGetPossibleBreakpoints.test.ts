import {
  DebuggerGetPossibleBreakpoints,
  VscodeDebuggerGetPossibleBreakpointsHandler,
} from '../VscodeDebuggerGetPossibleBreakpoints';
import { DebuggerRequest } from '../types';

it('does not respond on non-vscode debugger type', () => {
  const handler = new VscodeDebuggerGetPossibleBreakpointsHandler();

  const message: DebuggerRequest<DebuggerGetPossibleBreakpoints> = {
    id: 420,
    method: 'Debugger.getPossibleBreakpoints',
    params: {
      start: { lineNumber: 13, columnNumber: 37, scriptId: '1337' },
    },
  };

  // Should not stop propagation for non-vscode debugger type
  expect(handler.onDebuggerMessage(message, {})).toBe(false);
  expect(handler.onDebuggerMessage(message, { debuggerType: 'generic' })).toBe(false);
});

it('responds to `Debugger.getPossibleBreakpoints` with empty `locations`', () => {
  const handler = new VscodeDebuggerGetPossibleBreakpointsHandler();
  const debuggerInfo = {
    debuggerType: 'vscode',
    socket: { send: jest.fn() },
  };

  const message: DebuggerRequest<DebuggerGetPossibleBreakpoints> = {
    id: 420,
    method: 'Debugger.getPossibleBreakpoints',
    params: {
      start: { lineNumber: 13, columnNumber: 37, scriptId: '1337' },
    },
  };

  // Should stop propagation when handled
  expect(handler.onDebuggerMessage(message, debuggerInfo)).toBe(true);
  // Should send a response with empty locations
  expect(debuggerInfo.socket.send).toBeCalledWith(
    JSON.stringify({
      id: 420,
      result: { locations: [] },
    })
  );
});

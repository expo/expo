import { mockConnection } from './testUtilts';
import {
  type DebuggerGetPossibleBreakpoints,
  VscodeDebuggerGetPossibleBreakpointsMiddleware,
} from '../VscodeDebuggerGetPossibleBreakpoints';
import { type DebuggerRequest } from '../types';
import { getDebuggerType } from '../utils';

jest.mock('../utils', () => ({
  ...jest.requireActual('../utils'),
  getDebuggerType: jest.fn(() => 'unknown'),
}));

it('is enabled when debugger has vscode user agent', () => {
  jest.mocked(getDebuggerType).mockReturnValue('vscode');
  const handler = new VscodeDebuggerGetPossibleBreakpointsMiddleware(mockConnection());
  expect(handler.isEnabled()).toBe(true);
});

it('is disabled when debugger doesnt have vscode user agent', () => {
  jest.mocked(getDebuggerType).mockReturnValue('unknown');
  const handler = new VscodeDebuggerGetPossibleBreakpointsMiddleware(mockConnection());
  expect(handler.isEnabled()).toBe(false);
});

it('responds to `Debugger.getPossibleBreakpoints` with empty `locations`', () => {
  const connection = mockConnection();
  const handler = new VscodeDebuggerGetPossibleBreakpointsMiddleware(connection);

  const message: DebuggerRequest<DebuggerGetPossibleBreakpoints> = {
    id: 420,
    method: 'Debugger.getPossibleBreakpoints',
    params: {
      start: { lineNumber: 13, columnNumber: 37, scriptId: '1337' },
    },
  };

  // Should stop propagation when handled
  expect(handler.handleDebuggerMessage(message)).toBe(true);
  // Should send a response with empty locations
  expect(connection.debuggerInfo.socket.send).toBeCalledWith(
    JSON.stringify({
      id: 420,
      result: { locations: [] },
    })
  );
});

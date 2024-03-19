import { mockConnection } from './testUtilts';
import { getDebuggerType } from '../../getDebuggerType';
import type { DebuggerRequest } from '../../types';
import {
  type DebuggerGetPossibleBreakpoints,
  VscodeDebuggerGetPossibleBreakpointsHandler,
} from '../VscodeDebuggerGetPossibleBreakpoints';

jest.mock('../../getDebuggerType', () => ({
  ...jest.requireActual('../../getDebuggerType'),
  getDebuggerType: jest.fn(() => 'unknown'),
}));

it('is enabled when debugger has vscode user agent', () => {
  jest.mocked(getDebuggerType).mockReturnValue('vscode');
  const handler = new VscodeDebuggerGetPossibleBreakpointsHandler(mockConnection());
  expect(handler.isEnabled()).toBe(true);
});

it('is disabled when debugger doesnt have vscode user agent', () => {
  jest.mocked(getDebuggerType).mockReturnValue('unknown');
  const handler = new VscodeDebuggerGetPossibleBreakpointsHandler(mockConnection());
  expect(handler.isEnabled()).toBe(false);
});

it('responds to `Debugger.getPossibleBreakpoints` with empty `locations`', () => {
  const connection = mockConnection();
  const handler = new VscodeDebuggerGetPossibleBreakpointsHandler(connection);

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
  expect(connection.debugger.sendMessage).toBeCalledWith(
    expect.objectContaining({
      id: 420,
      result: { locations: [] },
    })
  );
});

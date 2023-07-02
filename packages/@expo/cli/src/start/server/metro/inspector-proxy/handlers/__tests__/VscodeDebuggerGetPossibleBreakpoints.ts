import { VscodeDebuggerGetPossibleBreakpointsHandler } from '../VscodeDebuggerGetPossibleBreakpoints';

it('responds to `Debugger.getPossibleBreakpoints` with empty `locations`', () => {
  const handler = new VscodeDebuggerGetPossibleBreakpointsHandler();
  const debuggerSocket = { send: jest.fn() };

  expect(
    handler.onDebuggerMessage(
      {
        id: 420,
        method: 'Debugger.getPossibleBreakpoints',
        params: {
          start: { lineNumber: 13, columnNumber: 37, scriptId: '1337' },
        },
      },
      { socket: debuggerSocket }
    )
  ).toBe(true);

  expect(debuggerSocket.send).toBeCalledWith(
    JSON.stringify({
      id: 420,
      result: { locations: [] },
    })
  );
});

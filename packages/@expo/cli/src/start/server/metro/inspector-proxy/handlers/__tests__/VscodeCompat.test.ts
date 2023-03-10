import {
  DebuggerSetBreakpointByUrl,
  RuntimeGetProperties,
  VscodeCompatHandler,
} from '../VscodeCompat';
import { DebuggerRequest } from '../types';

it('responds to `Debugger.getPossibleBreakpoints` with empty `locations`', () => {
  const handler = new VscodeCompatHandler();
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

it('mutates `Runtime.getProperties` device response with `description` properties', () => {
  const handler = new VscodeCompatHandler();
  const debuggerSocket = { send: jest.fn() };

  // This message should still be propagated, it should return `false`
  expect(
    handler.onDebuggerMessage(
      {
        id: 420,
        method: 'Runtime.getProperties',
        params: { objectId: '1337' },
      },
      { socket: debuggerSocket }
    )
  ).toBe(false);

  // The handler mutates the properties, we need to keep a reference
  const descriptors: RuntimeGetProperties['result'] = {
    result: [
      {
        name: 'foo',
        configurable: true,
        enumerable: true,
        value: { type: 'function' },
      },
      {
        name: 'bar',
        configurable: true,
        enumerable: true,
        value: { type: 'string', description: 'Dont overwrite' },
      },
    ],
  };

  // This message should still be propagated, it should return `false`
  expect(handler.onDeviceMessage({ id: 420, result: descriptors })).toBe(false);
  // Expect the descriptor values to be mutated
  expect(descriptors.result[0].value).toHaveProperty('description', '');
  expect(descriptors.result[1].value).toHaveProperty('description', 'Dont overwrite');
});

it('mutates `Runtime.getProperties` device responses and removes `objectId` from symbol types', () => {
  const handler = new VscodeCompatHandler();
  const debuggerSocket = { send: jest.fn() };

  // This message should still be propagated, it should return `false`
  expect(
    handler.onDebuggerMessage(
      {
        id: 420,
        method: 'Runtime.getProperties',
        params: { objectId: '1337' },
      },
      { socket: debuggerSocket }
    )
  ).toBe(false);

  // The handler mutates the properties, we need to keep a reference
  const descriptors: RuntimeGetProperties['result'] = {
    result: [
      {
        name: 'bar',
        configurable: true,
        enumerable: true,
        value: { type: 'symbol', description: 'Symbol(bar)', objectId: '1337' },
      },
    ],
  };

  // This message should still be propagated, it should return `false`
  expect(handler.onDeviceMessage({ id: 420, result: descriptors })).toBe(false);
  // Expect the descriptor value to be mutated
  expect(descriptors.result[0].value).not.toHaveProperty('objectId');
});

it('mutates `Debugger.setBreakpointByUrl` debugger request to create an unbounded breakpoint', () => {
  const handler = new VscodeCompatHandler();
  const debuggerSocket = { send: jest.fn() };

  const localHttpUrl: DebuggerRequest<DebuggerSetBreakpointByUrl> = {
    id: 420,
    method: 'Debugger.setBreakpointByUrl',
    params: {
      urlRegex: 'file:\\/\\/http:\\/localhost:8081\\/App\\.js($|\\?)',
      lineNumber: 14,
      columnNumber: 0,
    },
  };

  const lanHttpsUrl: DebuggerRequest<DebuggerSetBreakpointByUrl> = {
    id: 421,
    method: 'Debugger.setBreakpointByUrl',
    params: {
      urlRegex: 'file:\\/\\/http:\\/192\\.168\\.10\\.10:8081\\/App\\.js($|\\?)',
      lineNumber: 14,
      columnNumber: 0,
    },
  };

  const correctUrl: DebuggerRequest<DebuggerSetBreakpointByUrl> = {
    id: 422,
    method: 'Debugger.setBreakpointByUrl',
    params: {
      url: 'file:\\/\\/path\\/to\\/App\\.js',
      lineNumber: 14,
      columnNumber: 0,
    },
  };

  // These messages should still be propagated, it should return `false`
  expect(handler.onDebuggerMessage(localHttpUrl, { socket: debuggerSocket })).toBe(false);
  expect(handler.onDebuggerMessage(lanHttpsUrl, { socket: debuggerSocket })).toBe(false);
  expect(handler.onDebuggerMessage(correctUrl, { socket: debuggerSocket })).toBe(false);

  // Expect the `localHttpUrl` and `lanHttpsUrl` to be mutated
  expect(localHttpUrl.params).not.toHaveProperty('urlRegex');
  expect(localHttpUrl.params).toHaveProperty('url', 'file://__invalid_url__');

  expect(lanHttpsUrl.params).not.toHaveProperty('urlRegex');
  expect(lanHttpsUrl.params).toHaveProperty('url', 'file://__invalid_url__');

  // Expect the `correctUrl` to not be mutated
  expect(correctUrl.params.url).toBe('file:\\/\\/path\\/to\\/App\\.js');
});

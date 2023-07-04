import {
  DebuggerSetBreakpointByUrl,
  VscodeDebuggerSetBreakpointByUrlHandler,
} from '../VscodeDebuggerSetBreakpointByUrl';
import { DebuggerRequest } from '../types';

it('does not respond on non-vscode debugger type', () => {
  const handler = new VscodeDebuggerSetBreakpointByUrlHandler();

  const message: DebuggerRequest<DebuggerSetBreakpointByUrl> = {
    id: 422,
    method: 'Debugger.setBreakpointByUrl',
    params: {
      url: 'file:\\/\\/path\\/to\\/App\\.js',
      lineNumber: 14,
      columnNumber: 0,
    },
  };

  // Should not stop propagation for non-vscode debugger type
  expect(handler.onDebuggerMessage(message, {})).toBe(false);
  expect(handler.onDebuggerMessage(message, { debuggerType: 'generic' })).toBe(false);
});

it('mutates `Debugger.setBreakpointByUrl` debugger request to create an unbounded breakpoint', () => {
  const handler = new VscodeDebuggerSetBreakpointByUrlHandler();
  const debuggerInfo = { debuggerType: 'vscode' };

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
  expect(handler.onDebuggerMessage(localHttpUrl, debuggerInfo)).toBe(false);
  expect(handler.onDebuggerMessage(lanHttpsUrl, debuggerInfo)).toBe(false);
  expect(handler.onDebuggerMessage(correctUrl, debuggerInfo)).toBe(false);

  // Expect the `localHttpUrl` and `lanHttpsUrl` to be mutated
  expect(localHttpUrl.params).not.toHaveProperty('urlRegex');
  expect(localHttpUrl.params).toHaveProperty('url', 'file://__invalid_url__');

  expect(lanHttpsUrl.params).not.toHaveProperty('urlRegex');
  expect(lanHttpsUrl.params).toHaveProperty('url', 'file://__invalid_url__');

  // Expect the `correctUrl` to not be mutated
  expect(correctUrl.params.url).toBe('file:\\/\\/path\\/to\\/App\\.js');
});

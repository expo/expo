import { mockConnection } from './testUtilts';
import { getDebuggerType } from '../../getDebuggerType';
import type { DebuggerRequest } from '../../types';
import {
  type DebuggerSetBreakpointByUrl,
  VscodeDebuggerSetBreakpointByUrlHandler,
} from '../VscodeDebuggerSetBreakpointByUrl';

jest.mock('../../getDebuggerType', () => ({
  ...jest.requireActual('../../getDebuggerType'),
  getDebuggerType: jest.fn(() => 'unknown'),
}));

it('is enabled when debugger has vscode user agent', () => {
  jest.mocked(getDebuggerType).mockReturnValue('vscode');
  const handler = new VscodeDebuggerSetBreakpointByUrlHandler(mockConnection());
  expect(handler.isEnabled()).toBe(true);
});

it('is disabled when debugger doesnt have vscode user agent', () => {
  jest.mocked(getDebuggerType).mockReturnValue('unknown');
  const handler = new VscodeDebuggerSetBreakpointByUrlHandler(mockConnection());
  expect(handler.isEnabled()).toBe(false);
});

it('mutates `Debugger.setBreakpointByUrl` debugger request to create an unbounded breakpoint', () => {
  const connection = mockConnection();
  const handler = new VscodeDebuggerSetBreakpointByUrlHandler(connection);
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
  expect(handler.handleDebuggerMessage(localHttpUrl)).toBe(false);
  expect(handler.handleDebuggerMessage(lanHttpsUrl)).toBe(false);
  expect(handler.handleDebuggerMessage(correctUrl)).toBe(false);

  // Expect the `localHttpUrl` and `lanHttpsUrl` to be mutated
  expect(localHttpUrl.params).not.toHaveProperty('urlRegex');
  expect(localHttpUrl.params).toHaveProperty('url', 'file://__invalid_url__');

  expect(lanHttpsUrl.params).not.toHaveProperty('urlRegex');
  expect(lanHttpsUrl.params).toHaveProperty('url', 'file://__invalid_url__');

  // Expect the `correctUrl` to not be mutated
  expect(correctUrl.params.url).toBe('file:\\/\\/path\\/to\\/App\\.js');
});

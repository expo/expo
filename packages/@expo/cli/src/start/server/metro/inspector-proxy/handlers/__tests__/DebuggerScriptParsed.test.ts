import { DebuggerScriptParsed, DebuggerScriptParsedHandler } from '../DebuggerScriptParsed';

it('does not handle the initial message', () => {
  const handler = new DebuggerScriptParsedHandler();
  const initialMessage = handler.onDebuggerMessage({
    id: 420,
    method: 'Debugger.scriptParsed',
    params: { ...mockMessageParams, scriptId: '3' },
  });

  expect(initialMessage).toBe(false);
});

it('does not handle the identical script ID messages', () => {
  const handler = new DebuggerScriptParsedHandler();
  const initialMessage = handler.onDebuggerMessage({
    id: 420,
    method: 'Debugger.scriptParsed',
    params: { ...mockMessageParams, scriptId: '3' },
  });

  const identicalScriptIdMessage = handler.onDebuggerMessage({
    id: 421,
    method: 'Debugger.scriptParsed',
    params: { ...mockMessageParams, scriptId: '3' },
  });

  expect(initialMessage).toBe(false);
  expect(identicalScriptIdMessage).toBe(false);
});

it('handles outdated script ID messages', () => {
  const handler = new DebuggerScriptParsedHandler();

  const initialMessage = handler.onDebuggerMessage({
    id: 420,
    method: 'Debugger.scriptParsed',
    params: { ...mockMessageParams, scriptId: '3' },
  });

  const newerScriptIdMessage = handler.onDebuggerMessage({
    id: 421,
    method: 'Debugger.scriptParsed',
    params: { ...mockMessageParams, scriptId: '6' },
  });

  const olderScriptIdMessage = handler.onDebuggerMessage({
    id: 422,
    method: 'Debugger.scriptParsed',
    params: { ...mockMessageParams, scriptId: '5' },
  });

  const oldestScriptIdMessage = handler.onDebuggerMessage({
    id: 423,
    method: 'Debugger.scriptParsed',
    params: { ...mockMessageParams, scriptId: '4' },
  });

  expect(initialMessage).toBe(false);
  expect(newerScriptIdMessage).toBe(false);
  expect(olderScriptIdMessage).toBe(true);
  expect(oldestScriptIdMessage).toBe(true);
});

// Copied from the protocol monitor from a blank template
const mockMessageParams: DebuggerScriptParsed['params'] = {
  url: 'http://localhost:8081/node_modules/expo/AppEntry.bundle//&platform=ios&dev=true&minify=false&modulesOnly=false&runModule=true&app=com.bycedric.TestDebugExpo',
  startColumn: 0,
  startLine: 0,
  scriptId: '3',
  endColumn: 0,
  hash: '',
  endLine: 0,
  // Note: `metro-inspector-proxy` inlines the base64 source map string in here, but that's 12mb and irrelevant for testing
  sourceMapURL:
    'http://localhost:8081/node_modules/expo/AppEntry.map//&platform=ios&dev=true&minify=false&modulesOnly=false&runModule=true&app=com.bycedric.TestDebugExpo',
  executionContextId: 1,
};

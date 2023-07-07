import {
  DebuggerScriptParsed,
  VscodeDebuggerScriptParsedHandler,
} from '../VscodeDebuggerScriptParsed';
import { DebuggerRequest } from '../types';

it('does not respond on non-vscode debugger type', () => {
  const device = makeTestDevice();
  const handler = new VscodeDebuggerScriptParsedHandler(device);

  // Copied from `Debugger.scriptParsed` message in the protocol monitor
  const message: DebuggerRequest<DebuggerScriptParsed> = {
    id: 420,
    method: 'Debugger.scriptParsed',
    params: {
      executionContextId: 1,
      scriptId: '3',
      startColumn: 0,
      endColumn: 0,
      startLine: 0,
      endLine: 0,
      hash: '',
      url: 'http://127.0.0.1:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true',
      sourceMapURL:
        'http://127.0.0.1:8081/node_modules/expo-router/entry.map//&platform=ios&dev=true&hot=false&lazy=true',
    },
  };

  // Should not stop propagation for non-vscode debugger type
  expect(handler.onDeviceMessage(message, {})).toBe(false);
  expect(handler.onDeviceMessage(message, { debuggerType: 'generic' })).toBe(false);
});

it('does not replace "sourceMapUrl" with inline source map', () => {
  const device = makeTestDevice();
  const handler = new VscodeDebuggerScriptParsedHandler(device);
  const debuggerInfo = { debuggerType: 'vscode' };

  // Copied from `Debugger.scriptParsed` message in the protocol monitor
  const message: DebuggerRequest<DebuggerScriptParsed> = {
    id: 420,
    method: 'Debugger.scriptParsed',
    params: {
      executionContextId: 1,
      scriptId: '3',
      startColumn: 0,
      endColumn: 0,
      startLine: 0,
      endLine: 0,
      hash: '',
      url: 'http://127.0.0.1:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true',
      sourceMapURL:
        'http://127.0.0.1:8081/node_modules/expo-router/entry.map//&platform=ios&dev=true&hot=false&lazy=true',
    },
  };

  // Message should stop propagating because its handled
  expect(handler.onDeviceMessage(message, debuggerInfo)).toBe(true);
  // Message `sourceMapUrl` should not be modified (replaced with base64 string)
  expect(message.params.sourceMapURL).toBe(
    'http://127.0.0.1:8081/node_modules/expo-router/entry.map//&platform=ios&dev=true&hot=false&lazy=true'
  );
});

it('replaces "sourceMapUrl" containing android emulator address "10.0.2.2" with "localhost"', () => {
  const device = makeTestDevice();
  const handler = new VscodeDebuggerScriptParsedHandler(device);
  const debuggerInfo = { debuggerType: 'vscode' };

  // Copied from `Debugger.scriptParsed` message in the protocol monitor
  const message: DebuggerRequest<DebuggerScriptParsed> = {
    id: 420,
    method: 'Debugger.scriptParsed',
    params: {
      executionContextId: 1,
      scriptId: '3',
      startColumn: 0,
      endColumn: 0,
      startLine: 0,
      endLine: 0,
      hash: '',
      url: 'http://10.0.2.2:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true',
      sourceMapURL:
        'http://10.0.2.2:8081/node_modules/expo-router/entry.map//&platform=ios&dev=true&hot=false&lazy=true',
    },
  };

  // Message should stop propagating because its handled
  expect(handler.onDeviceMessage(message, debuggerInfo)).toBe(true);
  // Original source URL should be saved
  expect(debuggerInfo).toHaveProperty('originalSourceURLAddress', '10.0.2.2');
  // Source map URL should be updated
  expect(message.params.sourceMapURL).toBe(
    'http://localhost:8081/node_modules/expo-router/entry.map//&platform=ios&dev=true&hot=false&lazy=true'
  );
});

it('replaces "url" containing android emulator address "10.0.3.2" with "localhost"', () => {
  const device = makeTestDevice();
  const handler = new VscodeDebuggerScriptParsedHandler(device);
  const debuggerInfo = { debuggerType: 'vscode' };

  // Copied from `Debugger.scriptParsed` message in the protocol monitor
  const message: DebuggerRequest<DebuggerScriptParsed> = {
    id: 420,
    method: 'Debugger.scriptParsed',
    params: {
      executionContextId: 1,
      scriptId: '3',
      startColumn: 0,
      endColumn: 0,
      startLine: 0,
      endLine: 0,
      hash: '',
      url: 'http://10.0.3.2:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true',
      sourceMapURL:
        'http://10.0.3.2:8081/node_modules/expo-router/entry.map//&platform=ios&dev=true&hot=false&lazy=true',
    },
  };

  // Message should stop propagating because its handled
  expect(handler.onDeviceMessage(message, debuggerInfo)).toBe(true);
  // Original source URL should be saved
  expect(debuggerInfo).toHaveProperty('originalSourceURLAddress', '10.0.3.2');
  // URL should be updated
  expect(message.params.url).toBe(
    'http://localhost:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true'
  );
});

it('replaces alphanumeric hash "url" with "file://" prefix', () => {
  const device = makeTestDevice();
  const handler = new VscodeDebuggerScriptParsedHandler(device);
  const debuggerInfo = { debuggerType: 'vscode' };

  // Copied from `Debugger.scriptParsed` message in the protocol monitor
  const message: DebuggerRequest<DebuggerScriptParsed> = {
    id: 420,
    method: 'Debugger.scriptParsed',
    params: {
      executionContextId: 1,
      scriptId: '3',
      startColumn: 0,
      endColumn: 0,
      startLine: 0,
      endLine: 0,
      hash: '',
      url: 'abc123',
      sourceMapURL:
        'http://10.0.3.2:8081/node_modules/expo-router/entry.map//&platform=ios&dev=true&hot=false&lazy=true',
    },
  };

  // Message should stop propagating because its handled
  expect(handler.onDeviceMessage(message, debuggerInfo)).toBe(true);
  // Original source URL should be saved
  expect(debuggerInfo).toHaveProperty('prependedFilePrefix', true);
  // URL should be updated
  expect(message.params.url).toBe('file://abc123');
});

it('stores the "scriptId" to map to source path', () => {
  const device = makeTestDevice();
  const handler = new VscodeDebuggerScriptParsedHandler(device);
  const debuggerInfo = { debuggerType: 'vscode' };

  // Copied from `Debugger.scriptParsed` message in the protocol monitor
  const message: DebuggerRequest<DebuggerScriptParsed> = {
    id: 420,
    method: 'Debugger.scriptParsed',
    params: {
      executionContextId: 1,
      scriptId: '3',
      startColumn: 0,
      endColumn: 0,
      startLine: 0,
      endLine: 0,
      hash: '',
      url: 'http://127.0.0.1:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true',
      sourceMapURL:
        'http://127.0.0.1:8081/node_modules/expo-router/entry.map//&platform=ios&dev=true&hot=false&lazy=true',
    },
  };

  // Message should stop propagating because its handled
  expect(handler.onDeviceMessage(message, debuggerInfo)).toBe(true);
  // When the script ID is defined, it should be stored in `device._scriptIdToSourcePathMapping`
  expect(device._scriptIdToSourcePathMapping.get('3')).toBe(
    'http://127.0.0.1:8081/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false&lazy=true'
  );
});

function makeTestDevice() {
  return {
    _scriptIdToSourcePathMapping: new Map<string, string>(),
    _projectRoot: '/fake/path/to/project',
  };
}

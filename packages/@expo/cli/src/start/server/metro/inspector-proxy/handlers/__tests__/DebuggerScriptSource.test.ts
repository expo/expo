import fs from 'fs';
import { vol } from 'memfs';
import fetch from 'node-fetch';
import path from 'path';

import { DebuggerScriptSourceHandler } from '../DebuggerScriptSource';

jest.mock('fs');
jest.mock('node-fetch');

afterEach(() => vol.reset());

it('responds to script source request from url', () => {
  const device = makeTestDevice();
  const handler = new DebuggerScriptSourceHandler(device);

  device._scriptIdToSourcePathMapping.set(
    '1337',
    'http://192.168.1.1:1900/index.bundle?platform=android'
  );

  // Mock successful response to fetch the bundle
  jest.mocked(fetch).mockImplementation(() =>
    Promise.resolve({
      ok: true,
      text: async () => 'fake bundle content',
    } as any)
  );

  // Fetch is async, but the handler is not. Assert response data in callback
  const debuggerSocket = {
    send: jest.fn((stringified) => {
      expect(stringified).toBe(
        JSON.stringify({ id: 420, result: { scriptSource: 'fake bundle content' } })
      );
    }),
  };

  expect(
    handler.onDebuggerMessage(
      {
        id: 420,
        method: 'Debugger.getScriptSource',
        params: { scriptId: '1337' },
      },
      { socket: debuggerSocket }
    )
  ).toBe(true);

  expect(fetch).toBeCalledWith('http://192.168.1.1:1900/index.bundle?platform=android');
});

it('responds with fetch errors from url', () => {
  const device = makeTestDevice();
  const handler = new DebuggerScriptSourceHandler(device);

  device._scriptIdToSourcePathMapping.set(
    '1337',
    'http://192.168.1.1:1900/nonexisting.bundle?platform=android'
  );

  // Mock failed response to fetch the bundle
  jest.mocked(fetch).mockImplementation(() =>
    Promise.resolve({
      ok: false,
      status: 404,
      text() {
        throw new Error('Cant load this');
      },
    } as any)
  );

  // Fetch is async, but the handler is not. Assert response data in callback
  const debuggerSocket = {
    send: jest.fn((stringified) => {
      expect(stringified).toBe(
        JSON.stringify({
          id: 420,
          error: {
            message:
              'Received status 404 while fetching: http://192.168.1.1:1900/nonexisting.bundle?platform=android',
          },
        })
      );
    }),
  };

  expect(
    handler.onDebuggerMessage(
      {
        id: 420,
        method: 'Debugger.getScriptSource',
        params: { scriptId: '1337' },
      },
      { socket: debuggerSocket }
    )
  ).toBe(true);

  expect(fetch).toBeCalledWith('http://192.168.1.1:1900/nonexisting.bundle?platform=android');
});

it('responds to script source request from path', () => {
  const device = makeTestDevice();
  const handler = new DebuggerScriptSourceHandler(device);
  const debuggerSocket = { send: jest.fn() };

  vol.fromJSON({ 'App.js': 'fake app content' }, device._projectRoot);
  device._scriptIdToSourcePathMapping.set('1337', path.join(device._projectRoot, 'App.js'));

  expect(
    handler.onDebuggerMessage(
      {
        id: 420,
        method: 'Debugger.getScriptSource',
        params: { scriptId: '1337' },
      },
      { socket: debuggerSocket }
    )
  ).toBe(true);

  expect(debuggerSocket.send).toBeCalledWith(
    JSON.stringify({
      id: 420,
      result: { scriptSource: 'fake app content' },
    })
  );
});

it('responds with read errors from path', () => {
  const device = makeTestDevice();
  const handler = new DebuggerScriptSourceHandler(device);
  const debuggerSocket = { send: jest.fn() };
  const filePath = path.join(device._projectRoot, 'App.js');

  vol.fromJSON({ 'App.js': 'fake app content' }, device._projectRoot);
  device._scriptIdToSourcePathMapping.set('1337', path.join(device._projectRoot, 'App.js'));

  jest.spyOn(fs, 'readFileSync').mockImplementationOnce(() => {
    throw new Error('Fake IO error');
  });

  expect(
    handler.onDebuggerMessage(
      {
        id: 420,
        method: 'Debugger.getScriptSource',
        params: { scriptId: '1337' },
      },
      { socket: debuggerSocket }
    )
  ).toBe(true);

  expect(debuggerSocket.send).toBeCalledWith(
    JSON.stringify({
      id: 420,
      error: {
        message: `Failed to load "${filePath}": Fake IO error`,
      },
    })
  );
});

it('does not respond to non-existing script', () => {
  const device = makeTestDevice();
  const handler = new DebuggerScriptSourceHandler(device);
  const debuggerSocket = { send: jest.fn() };

  expect(
    handler.onDebuggerMessage(
      {
        id: 420,
        method: 'Debugger.getScriptSource',
        params: { scriptId: '1337' },
      },
      { socket: debuggerSocket }
    )
  ).toBe(false);

  expect(debuggerSocket.send).not.toBeCalled();
});

function makeTestDevice() {
  return {
    _scriptIdToSourcePathMapping: new Map<string, string>(),
    _projectRoot: '/fake/path/to/project',
  };
}

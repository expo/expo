// @ref llp/0004-smart-start-and-project-state.rfc.md §`exagent status`
// Step 0 of dev-server discovery: the project's own lock. Against a real lock server, because the
// property under test is that the lock answers only while it is held.

import fs from 'fs';

import { lockAddressFor } from '../../devLock';
import { cleanupTempProjects, makeTempProject } from '../../devLock/__tests__/tempProject';
import { acquireDevServerLockAsync } from '../../devLock/server';
import type { DevServerLockHandle } from '../../devLock/types';
import { discoverDevServerAsync } from '../devServer';

// The suite-wide `fs` mock is memfs, which the kernel cannot bind a socket inside.
jest.unmock('fs');
jest.unmock('node:fs');

const target = { webSocketDebuggerUrl: 'ws://x' } as any;

/** Answer `/json/list` per port: a targets array, or refuse the connection. */
function mockFetchByPort(answers: { [port: string]: any[] }) {
  jest.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = new URL(String(input));
    const answer = answers[url.port];
    if (answer === undefined) {
      throw new Error('ECONNREFUSED');
    }
    return { ok: true, json: async () => answer } as Response;
  });
}

const held: DevServerLockHandle[] = [];

/** Hold a lock naming `port` for the duration of the test. */
async function holdLockAsync(projectRoot: string, port: number): Promise<void> {
  const result = await acquireDevServerLockAsync({
    url: `http://127.0.0.1:${port}`,
    port,
    pid: process.pid,
    startedAt: new Date().toISOString(),
    projectRoot,
  });
  if (result.status !== 'acquired') {
    throw new Error(`expected the lock to be acquired, got ${result.status}`);
  }
  held.push(result.lock);
}

afterEach(() => {
  for (const lock of held.splice(0)) {
    lock.release();
  }
  cleanupTempProjects();
  jest.restoreAllMocks();
});

describe('discoverDevServerAsync — the project lock', () => {
  it(`uses the port the lock names, without scanning`, async () => {
    const projectRoot = makeTempProject();
    await holdLockAsync(projectRoot, 8090);
    mockFetchByPort({ '8090': [target] });

    const result = await discoverDevServerAsync(undefined, { projectRoot, timeoutMs: 200 });

    expect(result).toMatchObject({
      reachable: true,
      devServerUrl: 'http://127.0.0.1:8090',
      source: 'lock',
      discovered: true,
    });
    // The lock answered and the URL it named answered: nothing else was tried.
    expect(jest.mocked(fetch)).toHaveBeenCalledTimes(1);
  });

  it(`falls through when the URL the lock names does not answer`, async () => {
    // The lock proves the wrapper is alive, not that its dev server is, so the URL is probed.
    const projectRoot = makeTempProject();
    await holdLockAsync(projectRoot, 8090);
    mockFetchByPort({ '8083': [target] });

    const result = await discoverDevServerAsync(undefined, { projectRoot, timeoutMs: 200 });

    expect(result.devServerUrl).toBe('http://127.0.0.1:8083');
  });

  it(`does not consult the lock when an explicit URL was given`, async () => {
    const projectRoot = makeTempProject();
    await holdLockAsync(projectRoot, 8090);
    mockFetchByPort({ '9999': [target] });

    const result = await discoverDevServerAsync('http://127.0.0.1:9999', { projectRoot });

    expect(result).toMatchObject({
      devServerUrl: 'http://127.0.0.1:9999',
      source: 'flag',
      discovered: false,
    });
    expect(jest.mocked(fetch)).toHaveBeenCalledTimes(1);
  });

  it(`ignores a released lock`, async () => {
    const projectRoot = makeTempProject();
    await holdLockAsync(projectRoot, 8090);
    held.splice(0).forEach((lock) => lock.release());
    mockFetchByPort({ '8090': [target], '8081': [target] });

    const result = await discoverDevServerAsync(undefined, { projectRoot, timeoutMs: 200 });

    // 8090 answers, but nothing pointed discovery at it, so the ordinary steps ran.
    expect(result).toMatchObject({
      devServerUrl: 'http://127.0.0.1:8081',
      source: 'default',
      discovered: false,
    });
  });

  it(`ignores a socket file with no process behind it`, async () => {
    const projectRoot = makeTempProject();
    const { kind, address } = lockAddressFor(projectRoot);
    if (kind !== 'unix') {
      // Windows named pipes cannot be left behind: the kernel destroys one with its owner.
      return;
    }
    fs.writeFileSync(
      address,
      `${JSON.stringify({
        url: 'http://127.0.0.1:8090',
        port: 8090,
        pid: 1,
        startedAt: new Date().toISOString(),
        projectRoot,
      })}\n`
    );
    mockFetchByPort({ '8090': [target], '8081': [target] });

    const result = await discoverDevServerAsync(undefined, { projectRoot, timeoutMs: 200 });

    // The file says 8090 and 8090 answers, and discovery still went to 8081: a file is not a
    // lock, so nothing was read out of it.
    expect(result).toMatchObject({ devServerUrl: 'http://127.0.0.1:8081', discovered: false });
  });
});

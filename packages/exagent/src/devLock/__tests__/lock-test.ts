// @ref llp/0004-smart-start-and-project-state.rfc.md §`exagent status`
// The lock roundtrip, against the real socket implementation of the host platform. `node:net` is
// not mockable in any way that would still prove the property under test — that liveness is the
// connection — so these tests bind a real address in a real temporary project.

import fs from 'fs';
import path from 'path';

import { lockAddressFor } from '../address';
import { probeDevServerLockAsync, readDevServerLockAsync } from '../client';
import { acquireDevServerLockAsync } from '../server';
import type { DevServerLockInfo } from '../types';
import { cleanupTempProjects, makeTempProject as makeProjectRoot } from './tempProject';

// The suite-wide `fs` mock is memfs, which the kernel cannot bind a socket inside.
jest.unmock('fs');
jest.unmock('node:fs');

function lockInfo(projectRoot: string, port: number): DevServerLockInfo {
  return {
    url: `http://127.0.0.1:${port}`,
    port,
    pid: process.pid,
    startedAt: new Date().toISOString(),
    projectRoot,
  };
}

const acquired: { release(): void }[] = [];

/** Acquire and register for release, so a failing assertion never leaves an address bound. */
async function acquireAsync(info: DevServerLockInfo) {
  const result = await acquireDevServerLockAsync(info);
  if (result.status === 'acquired') {
    acquired.push(result.lock);
  }
  return result;
}

afterEach(() => {
  for (const lock of acquired.splice(0)) {
    lock.release();
  }
  cleanupTempProjects();
});

describe('dev server lock', () => {
  it(`answers the info it was acquired with`, async () => {
    const projectRoot = makeProjectRoot();
    const info = lockInfo(projectRoot, 8087);

    const result = await acquireAsync(info);

    expect(result).toMatchObject({ status: 'acquired' });
    expect(await readDevServerLockAsync(projectRoot)).toEqual(info);
  });

  it(`stops answering once released`, async () => {
    const projectRoot = makeProjectRoot();
    const result = await acquireAsync(lockInfo(projectRoot, 8088));
    if (result.status !== 'acquired') {
      throw new Error(`expected the lock to be acquired, got ${result.status}`);
    }

    result.lock.release();

    // Liveness is the connection, so a released lock is indistinguishable from one that never
    // existed. There is no stale answer to read, by construction.
    expect(await readDevServerLockAsync(projectRoot)).toBeNull();
    expect(await probeDevServerLockAsync(lockAddressFor(projectRoot).address)).toEqual({
      connected: false,
      info: null,
    });
  });

  it(`reports no lock for a project that never had one`, async () => {
    expect(await readDevServerLockAsync(makeProjectRoot())).toBeNull();
  });

  it(`refuses a second lock for the same project and names the holder`, async () => {
    const projectRoot = makeProjectRoot();
    const first = lockInfo(projectRoot, 8089);
    await acquireAsync(first);

    const second = await acquireAsync(lockInfo(projectRoot, 8090));

    expect(second).toMatchObject({ status: 'in-use', holder: first });
    // The first holder still owns the address, and still answers with its own port.
    expect(await readDevServerLockAsync(projectRoot)).toEqual(first);
  });

  it(`locks two projects independently`, async () => {
    const one = makeProjectRoot();
    const other = makeProjectRoot();
    const oneInfo = lockInfo(one, 8081);
    const otherInfo = lockInfo(other, 8082);

    expect(await acquireAsync(oneInfo)).toMatchObject({ status: 'acquired' });
    expect(await acquireAsync(otherInfo)).toMatchObject({ status: 'acquired' });

    expect(await readDevServerLockAsync(one)).toEqual(oneInfo);
    expect(await readDevServerLockAsync(other)).toEqual(otherInfo);
  });

  it(`creates the .expo directory it needs`, async () => {
    const projectRoot = makeProjectRoot();
    fs.rmSync(path.join(projectRoot, '.expo'), { recursive: true, force: true });

    expect(await acquireAsync(lockInfo(projectRoot, 8091))).toMatchObject({ status: 'acquired' });
  });
});

// A leftover socket file is the only artifact the lock can leave behind, and it is inert:
// connecting to it fails, so no reader is ever misled. It is still removed on the next
// acquisition, so the address does not stay unusable.
describe('dev server lock — a stale address', () => {
  const posixOnly = lockAddressFor(process.cwd()).kind === 'unix' ? it : it.skip;

  posixOnly(`is not a lock, whatever the file says`, async () => {
    const projectRoot = makeProjectRoot();
    const { address } = lockAddressFor(projectRoot);
    // A plausible-looking answer, written by nothing: the failure mode a JSON file would have.
    fs.writeFileSync(address, `${JSON.stringify(lockInfo(projectRoot, 4242))}\n`);

    expect(await readDevServerLockAsync(projectRoot)).toBeNull();
  });

  posixOnly(`is replaced by the next acquisition`, async () => {
    const projectRoot = makeProjectRoot();
    const { address } = lockAddressFor(projectRoot);
    fs.writeFileSync(address, `${JSON.stringify(lockInfo(projectRoot, 4242))}\n`);
    const info = lockInfo(projectRoot, 8092);

    const result = await acquireAsync(info);

    expect(result).toMatchObject({ status: 'acquired' });
    if (result.status === 'acquired') {
      expect(result.lock.replacedStale).toBe(true);
    }
    expect(await readDevServerLockAsync(projectRoot)).toEqual(info);
  });

  posixOnly(`is removed on release, so nothing outlives the process`, async () => {
    const projectRoot = makeProjectRoot();
    const { address } = lockAddressFor(projectRoot);
    const result = await acquireAsync(lockInfo(projectRoot, 8093));
    if (result.status !== 'acquired') {
      throw new Error(`expected the lock to be acquired, got ${result.status}`);
    }
    expect(fs.existsSync(address)).toBe(true);

    result.lock.release();

    expect(fs.existsSync(address)).toBe(false);
  });
});

describe('dev server lock — a garbled answer', () => {
  it(`is read as no lock at all`, async () => {
    const projectRoot = makeProjectRoot();
    const info = lockInfo(projectRoot, 8094);
    // A port is required, so an answer without one is not an answer.
    await acquireAsync({ ...info, port: undefined as unknown as number });

    const probe = await probeDevServerLockAsync(lockAddressFor(projectRoot).address);

    // The connection still proves a live owner; only its payload was unusable.
    expect(probe).toEqual({ connected: true, info: null });
    expect(await readDevServerLockAsync(projectRoot)).toBeNull();
  });

  it(`does not free the address, because the owner is alive`, async () => {
    const projectRoot = makeProjectRoot();
    await acquireAsync({
      ...lockInfo(projectRoot, 8095),
      port: undefined as unknown as number,
    });

    expect(await acquireAsync(lockInfo(projectRoot, 8096))).toMatchObject({ status: 'in-use' });
  });
});

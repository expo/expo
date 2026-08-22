/* eslint-env jest */
// Real temporary projects for the tests that bind a real lock address.
//
// Only for suites that have called `jest.unmock('fs')`: the suite-wide `fs` mock is memfs, and the
// kernel cannot bind a socket inside it. This module reads `fs` through the importing suite's
// module registry, so an unmocked suite gets the real one.

import fs from 'fs';
import path from 'path';

// The suite-wide `os` mock pins `tmpdir()` to a path that only exists on posix, and `2g` reads
// the real one at import time, so this asks the real module directly instead of unmocking it.
const os = jest.requireActual<typeof import('os')>('os');

/**
 * Shortest writable temporary root this host offers.
 *
 * A unix domain socket path is capped at ~104 bytes by the kernel, and the macOS `os.tmpdir()`
 * spends 56 of them before the project even has a name, so a project created under it cannot hold
 * a bindable socket. Windows named pipes have no such limit, and its `os.tmpdir()` is short.
 */
function temporaryRoot(): string {
  // Named pipes have no path-length concern and `\tmp` is drive-relative on Windows
  // (its existence check can pass while creation fails on another drive) — the real
  // tmpdir is short enough there and always correct.
  if (process.platform === 'win32') {
    // The env vars are beyond any module mock's reach.
    return process.env.TEMP ?? process.env.TMP ?? os.tmpdir();
  }
  const short = path.join(path.sep, 'tmp');
  try {
    fs.accessSync(short, fs.constants.W_OK);
    return short;
  } catch {
    return os.tmpdir();
  }
}

const created: string[] = [];

/** A fresh project directory with its `.expo` in place. */
export function makeTempProject(): string {
  const projectRoot = fs.mkdtempSync(path.join(temporaryRoot(), 'exalock-'));
  created.push(projectRoot);
  fs.mkdirSync(path.join(projectRoot, '.expo'), { recursive: true });
  return projectRoot;
}

/** Remove every project made so far. Call from `afterEach`. */
export function cleanupTempProjects(): void {
  for (const dir of created.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

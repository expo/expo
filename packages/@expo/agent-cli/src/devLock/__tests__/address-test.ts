// @ref llp/0004-smart-start-and-project-state.rfc.md §Status
// The address is the whole contract of the lock: two processes that derive it differently never
// meet. Both platform branches are asserted from every host, because CI runs this file on one
// platform at a time and a branch nobody exercises is a branch nobody checks.

import os from 'os';
import path from 'path';

import { DEV_LOCK_PIPE_PREFIX, DEV_LOCK_SOCKET_NAME, lockAddressFor } from '../address';

const posix = { platform: 'darwin' as NodeJS.Platform };
const win32 = { platform: 'win32' as NodeJS.Platform };

describe(lockAddressFor, () => {
  it(`puts a socket file in the project's .expo on posix`, () => {
    const projectRoot = path.resolve(path.sep, 'a', 'project');

    expect(lockAddressFor(projectRoot, posix)).toEqual({
      kind: 'unix',
      address: path.join(projectRoot, '.expo', DEV_LOCK_SOCKET_NAME),
    });
  });

  it(`names a pipe after the project root on win32`, () => {
    const { kind, address } = lockAddressFor(path.resolve(path.sep, 'a', 'project'), win32);

    expect(kind).toBe('pipe');
    // A named pipe is not a project file, so the project can only be in its name.
    expect(address).toMatch(
      new RegExp(`^\\\\\\\\\\.\\\\pipe\\\\${DEV_LOCK_PIPE_PREFIX}[0-9a-f]{16}$`)
    );
  });

  it(`derives one address per project root, on both platforms`, () => {
    const one = path.resolve(path.sep, 'a', 'project');
    const other = path.resolve(path.sep, 'another', 'project');

    expect(lockAddressFor(one, win32).address).not.toBe(lockAddressFor(other, win32).address);
    expect(lockAddressFor(one, posix).address).not.toBe(lockAddressFor(other, posix).address);
  });

  it(`derives the same address twice for one project root`, () => {
    const projectRoot = path.resolve(path.sep, 'a', 'project');

    expect(lockAddressFor(projectRoot, win32)).toEqual(lockAddressFor(projectRoot, win32));
    expect(lockAddressFor(projectRoot, posix)).toEqual(lockAddressFor(projectRoot, posix));
  });

  it(`ignores the case of the project path in a pipe name`, () => {
    // NTFS compares paths without case, so two spellings of one project are one project, and
    // must not name two pipes that never find each other.
    const upper = path.resolve(path.sep, 'Users', 'Me', 'App');
    const lower = path.join(path.sep, 'users', 'me', 'app');

    expect(lockAddressFor(upper, win32).address).toBe(lockAddressFor(lower, win32).address);
  });

  it(`moves the socket out of a project too deep for the kernel's path limit`, () => {
    // A unix socket path is capped at ~104 bytes. An in-project path over the cap cannot be
    // bound at all, so the address is derived the way a pipe name is instead.
    const deep = path.resolve(path.sep, ...Array.from({ length: 20 }, (_, index) => `dir${index}`));
    const { kind, address } = lockAddressFor(deep, posix);

    expect(kind).toBe('unix');
    // Normalized: on a Windows host the forced-posix branch still joins with host separators,
    // so the mocked '/tmp' comes back as '\\tmp'. Same directory either way.
    expect(path.normalize(path.dirname(address))).toBe(path.normalize(os.tmpdir()));
    expect(path.basename(address)).toMatch(
      new RegExp(`^${DEV_LOCK_PIPE_PREFIX}[0-9a-f]{16}\\.sock$`)
    );
    // Still one address per project, and still the same one every time.
    expect(lockAddressFor(deep, posix).address).toBe(address);
    expect(lockAddressFor(path.join(deep, 'other'), posix).address).not.toBe(address);
  });

  it(`keeps the socket in the project when the path fits`, () => {
    const projectRoot = path.resolve(path.sep, 'a', 'project');
    const { address } = lockAddressFor(projectRoot, posix);

    expect(address.startsWith(projectRoot)).toBe(true);
  });

  it(`derives the pipe name from an absolute path, whatever the caller passed`, () => {
    const relative = path.join('a', 'project');

    expect(lockAddressFor(relative, win32).address).toBe(
      lockAddressFor(path.resolve(relative), win32).address
    );
  });
});

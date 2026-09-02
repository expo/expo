// @ref llp/0004-smart-start-and-project-state.rfc.md §Status
// Where the dev-server lock of a project listens.
//
// The address is the entire agreement between the process that holds the lock and the process
// that reads it: they never share a file, a registry, or a parent, so an address derived two
// different ways is two locks that never meet. It is therefore a pure function of the project
// root, and both sides call this one.

import crypto from 'crypto';
import os from 'os';
import path from 'path';

import { canonicalizeExistingPath } from '../utils/dir';

/** Name of the socket file the lock listens on inside a project's `.expo`. */
export const DEV_LOCK_SOCKET_NAME = 'agent-cli-dev-server.sock';

/** Prefix of the Windows named pipe, and of the fallback socket file, the lock listens on. */
export const DEV_LOCK_PIPE_PREFIX = 'agent-cli-dev-server-';

/** How much of the project-root digest goes into a derived name. */
const PIPE_HASH_LENGTH = 16;

/**
 * Longest socket path the lock will try to bind in a project.
 *
 * The kernel caps a unix socket path at the size of `sockaddr_un.sun_path`: 104 bytes on
 * macOS and the BSDs, 108 on Linux. A path over the cap fails to bind with `EINVAL` or
 * `ENAMETOOLONG`, so it is not used at all — see {@link lockAddressFor}.
 */
const MAX_UNIX_SOCKET_PATH = 100;

export interface DevLockAddress {
  /**
   * `unix`: a socket file inside the project, which can outlive its process as an inert
   * leftover. `pipe`: a Windows named pipe, which the kernel destroys with its owner.
   */
  kind: 'unix' | 'pipe';
  /** Value to hand to `net.createServer().listen()` and `net.connect()`. */
  address: string;
}

/**
 * The lock address of a project.
 *
 * On posix the socket lives in the project, next to everything else `.expo` holds, so it is
 * removed with the project and visible to a person wondering what is listening.
 *
 * Windows has no socket files: a named pipe lives in a machine-wide namespace, so the project it
 * belongs to can only be in its *name*. The name is a digest of the resolved project root, which
 * makes it derivable from the project root alone — the one thing both sides of the lock know.
 *
 * A project buried deep enough that its socket path would exceed
 * {@link MAX_UNIX_SOCKET_PATH} gets the same digest treatment in the temporary directory, because
 * the kernel would refuse the in-project path outright. The choice is a pure function of the path
 * length, so both sides of the lock make it identically without asking each other.
 *
 * @param platform Overrides the host platform, so both branches are testable from either one.
 */
export function lockAddressFor(
  projectRoot: string,
  { platform = process.platform }: { platform?: NodeJS.Platform } = {}
): DevLockAddress {
  // Every part of the address is derived from the canonical path, the length check included: two
  // processes that spell the project root differently must not pick two addresses.
  const canonical = canonicalProjectRoot(projectRoot);

  if (platform === 'win32') {
    return {
      kind: 'pipe',
      address: `\\\\.\\pipe\\${DEV_LOCK_PIPE_PREFIX}${digestOf(canonical)}`,
    };
  }

  const inProject = path.join(canonical, '.expo', DEV_LOCK_SOCKET_NAME);
  if (inProject.length <= MAX_UNIX_SOCKET_PATH) {
    return { kind: 'unix', address: inProject };
  }
  return {
    kind: 'unix',
    address: path.join(os.tmpdir(), `${DEV_LOCK_PIPE_PREFIX}${digestOf(canonical)}.sock`),
  };
}

/**
 * Stable short digest of a project path.
 *
 * Lowercased first, because the Windows filesystem compares paths without case — two spellings of
 * one project must not be two locks.
 */
function digestOf(canonicalPath: string): string {
  return crypto
    .createHash('sha1')
    .update(canonicalPath.toLowerCase())
    .digest('hex')
    .slice(0, PIPE_HASH_LENGTH);
}

/**
 * One spelling per project directory.
 *
 * Symlinks are resolved, so a project reached through a link and the same project reached directly
 * are one project — which is what makes both sides of the lock agree without talking to each
 * other.
 */
function canonicalProjectRoot(projectRoot: string): string {
  return canonicalizeExistingPath(projectRoot);
}

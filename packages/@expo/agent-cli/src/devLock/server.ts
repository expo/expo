// @ref llp/0004-smart-start-and-project-state.rfc.md §Status
// Holding the dev-server lock.
//
// The lock is a listening socket, not a file, so holding it *is* being alive. A reader learns
// where this project's dev server listens by connecting to it, and there is no state anywhere
// that can survive the process and mislead the next reader.

import fs from 'fs';
import net from 'net';
import path from 'path';

import { ensureDotExpoProjectDirectoryInitialized } from '../utils/dotExpo';
import { lockAddressFor } from './address';
import { probeDevServerLockAsync } from './client';
import { debugEvent } from './events';
import type { DevServerLockHandle, DevServerLockInfo } from './types';

export type DevServerLockResult =
  /** The address is ours, and answers with the info it was acquired with. */
  | { status: 'acquired'; lock: DevServerLockHandle }
  /** Another live process already owns this project's address. `holder` is what it answered. */
  | { status: 'in-use'; address: string; holder: DevServerLockInfo | null }
  /** The address could not be taken at all, e.g. a path the kernel refuses. */
  | { status: 'failed'; address: string; error: NodeJS.ErrnoException };

/**
 * Take this project's lock address and answer every connection with `info`.
 *
 * Never throws. Every way this can go wrong is one of the three results, because the caller runs
 * a dev server and a lock it could not take must not change that.
 */
export async function acquireDevServerLockAsync(
  info: DevServerLockInfo
): Promise<DevServerLockResult> {
  const { kind, address } = lockAddressFor(info.projectRoot);
  // One line, then the end of the connection: a reader needs no protocol beyond "read until
  // close". Serialized once, so every answer is byte-identical.
  const answer = `${JSON.stringify(info)}\n`;

  if (kind === 'unix') {
    try {
      // Through the shared helper, so the project's `.expo` carries the README that explains the
      // socket file. The socket's own directory is ensured separately, because a project path too
      // long for the kernel puts it outside `.expo` (see `lockAddressFor`).
      ensureDotExpoProjectDirectoryInitialized(info.projectRoot);
      fs.mkdirSync(path.dirname(address), { recursive: true });
    } catch (error: unknown) {
      return { status: 'failed', address, error: error as NodeJS.ErrnoException };
    }
  }

  const server = net.createServer((socket) => {
    // A reader that hangs up mid-write is normal (it may have timed out), and must not throw
    // inside the dev server's process.
    socket.on('error', () => {});
    socket.end(answer);
  });
  // The lock never keeps the CLI alive on its own: it lives exactly as long as the dev server the
  // caller is already waiting on.
  server.unref();

  let error = await listenAsync(server, address);
  let replacedStale = false;

  if (error?.code === 'EADDRINUSE') {
    if (kind === 'pipe') {
      // A Windows named pipe exists only while the process that created it does, so an address
      // that is taken has a live owner by definition. There is nothing stale to clean up.
      const { info: holder } = await probeDevServerLockAsync(address);
      closeQuietly(server);
      return { status: 'in-use', address, holder };
    }

    // A posix socket *file* outlives its process, so "taken" has two meanings and only a
    // connection can tell them apart.
    const probe = await probeDevServerLockAsync(address);
    if (probe.connected) {
      closeQuietly(server);
      return { status: 'in-use', address, holder: probe.info };
    }

    // Nothing accepted the connection, so the file is an orphan of a dead dev server. Removing it
    // can only lose an orphan: a socket file carries no state, and connecting to it is the only
    // way to reach whatever created it. What it says is never read — it was already ignored.
    try {
      fs.unlinkSync(address);
    } catch {
      // Another process got there first; the listen below decides who owns the address.
    }
    error = await listenAsync(server, address);
    if (error?.code === 'EADDRINUSE') {
      // Lost the race to another `@expo/agent-cli` that bound the freed address in between. It owns it.
      const { info: holder } = await probeDevServerLockAsync(address);
      closeQuietly(server);
      return { status: 'in-use', address, holder };
    }
    replacedStale = error == null;
  }

  if (error != null) {
    closeQuietly(server);
    return { status: 'failed', address, error };
  }

  server.on('error', (serverError: NodeJS.ErrnoException) => {
    debugEvent('dev_lock_server_error', { address, error: debugEvent.error(serverError) });
  });

  return { status: 'acquired', lock: createHandle(server, kind, address, replacedStale) };
}

/** Wrap the listening server in the handle its holder releases. */
function createHandle(
  server: net.Server,
  kind: 'unix' | 'pipe',
  address: string,
  replacedStale: boolean
): DevServerLockHandle {
  let released = false;

  const release = () => {
    if (released) {
      return;
    }
    released = true;
    process.removeListener('exit', release);
    closeQuietly(server);
    if (kind === 'unix') {
      try {
        fs.unlinkSync(address);
      } catch {
        // Already gone, or never ours to remove. A leftover file is inert (it answers no
        // connection) and the next acquisition removes it.
      }
    }
    debugEvent('dev_lock_released', { address });
  };

  // Every ordinary end of this process reaches the caller's own cleanup, because the dev-server
  // wrapper forwards terminal signals to the subprocess instead of dying on them
  // (`utils/expoCli.ts`). `exit` covers the rest: an uncaught error, an explicit `process.exit`,
  // or a signal nobody forwarded. It runs synchronously, which is all the cleanup needs.
  process.once('exit', release);

  return { address, replacedStale, release };
}

/** Listen, and resolve with the error instead of throwing it. */
function listenAsync(server: net.Server, address: string): Promise<NodeJS.ErrnoException | null> {
  return new Promise((resolve) => {
    const onError = (error: NodeJS.ErrnoException) => {
      server.removeListener('listening', onListening);
      resolve(error);
    };
    const onListening = () => {
      server.removeListener('error', onError);
      resolve(null);
    };
    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(address);
  });
}

/** Close a server that may never have started listening, without an error either way. */
function closeQuietly(server: net.Server): void {
  try {
    server.close(() => {});
  } catch {
    // Nothing to close; the address is free.
  }
}

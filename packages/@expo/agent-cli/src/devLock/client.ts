// @ref llp/0004-smart-start-and-project-state.rfc.md §Status
// Reading the dev-server lock.
//
// The read is a connection, not a file read, and that is the whole point: a record of a dev
// server can be out of date, but a connection to one cannot. Nothing answers unless a process is
// alive right now and holding the address open, so "connect refused" and "no dev server" are the
// same sentence.

import net from 'net';

import { lockAddressFor } from './address';
import { debugEvent } from './events';
import type { DevServerLockInfo } from './types';

/**
 * How long a reader waits for the lock to answer.
 *
 * The lock writes one line the moment a connection lands, over a local socket, so an answer that
 * takes longer than this is not coming. Kept short because a reader is usually a command a person
 * or an agent is waiting on.
 */
export const DEV_LOCK_CONNECT_TIMEOUT_MS = 250;

/** Cap on what a reader will buffer, so a socket that streams forever cannot grow this process. */
const MAX_ANSWER_BYTES = 64 * 1024;

export interface DevLockProbe {
  /**
   * The address accepted a connection, so a live process owns it. True even when the answer was
   * unusable: liveness is the connection, not the payload.
   */
  connected: boolean;
  /** The lock line it answered with, when that line was well formed. */
  info: DevServerLockInfo | null;
}

/**
 * Where this project's dev server says it listens, or null when no lock answers.
 *
 * Never throws: a project with no dev server is the ordinary case, not a failure.
 */
export async function readDevServerLockAsync(
  projectRoot: string,
  { timeoutMs = DEV_LOCK_CONNECT_TIMEOUT_MS }: { timeoutMs?: number } = {}
): Promise<DevServerLockInfo | null> {
  const { address } = lockAddressFor(projectRoot);
  const probe = await probeDevServerLockAsync(address, { timeoutMs });
  if (probe.connected && probe.info == null) {
    // Someone is holding this project's address and answering with something else. Worth a debug
    // line, because it is the one case where a live lock cannot be used.
    debugEvent('dev_lock_unreadable', { address });
  }
  return probe.info;
}

/**
 * Connect to a lock address and read what it answers.
 *
 * Split out from {@link readDevServerLockAsync} because acquisition needs the two halves apart:
 * whether anything is alive there decides if the address may be taken, while what it said only
 * decides what gets reported.
 */
export async function probeDevServerLockAsync(
  address: string,
  { timeoutMs = DEV_LOCK_CONNECT_TIMEOUT_MS }: { timeoutMs?: number } = {}
): Promise<DevLockProbe> {
  return await new Promise<DevLockProbe>((resolve) => {
    let connected = false;
    let answer = '';
    let settled = false;

    const socket = net.connect(address);

    const finish = (probe: DevLockProbe) => {
      if (settled) {
        return;
      }
      settled = true;
      socket.destroy();
      resolve(probe);
    };

    socket.setEncoding('utf8');
    socket.setTimeout(timeoutMs, () => finish({ connected, info: parseLockLine(answer) }));

    socket.on('connect', () => {
      connected = true;
    });
    socket.on('data', (chunk: string) => {
      answer += chunk;
      // The lock writes exactly one line and ends, so the first newline is the whole answer and
      // there is no reason to wait for the close.
      if (answer.includes('\n') || answer.length >= MAX_ANSWER_BYTES) {
        finish({ connected, info: parseLockLine(answer) });
      }
    });
    // A refused connection, a socket file with no listener, a missing pipe: all "no dev server".
    socket.on('error', () => finish({ connected, info: null }));
    socket.on('close', () => finish({ connected, info: parseLockLine(answer) }));
  });
}

/**
 * Parse one lock line into the info it names, or null.
 *
 * Every field is required. A partial answer is treated as no answer, because the point of the
 * lock is that what a reader gets is complete and current — half of it is neither.
 */
function parseLockLine(answer: string): DevServerLockInfo | null {
  const line = answer.split('\n', 1)[0]?.trim();
  if (!line) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(line);
  } catch {
    return null;
  }
  if (parsed == null || typeof parsed !== 'object') {
    return null;
  }

  const { url, port, pid, startedAt, projectRoot } = parsed as Record<string, unknown>;
  if (
    typeof url !== 'string' ||
    typeof port !== 'number' ||
    !Number.isInteger(port) ||
    typeof pid !== 'number' ||
    typeof startedAt !== 'string' ||
    typeof projectRoot !== 'string'
  ) {
    return null;
  }
  return { url, port, pid, startedAt, projectRoot };
}

// @ref llp/0004-smart-start-and-project-state.rfc.md §Daemonization
// Who is listening on a TCP port, asked of the operating system.
//
// Only `dev:stop` needs this, and only for the case the dev-server lock cannot answer: a port that
// something is on with no lock behind it. The answer is used to *name* that process in a report,
// and — with `--force` and a second, independent proof — to signal it.
//
// Deliberately best-effort. `lsof` is not installed everywhere, `netstat` prints differently
// across Windows versions, and neither is worth a hard dependency for a report line. A lookup that
// cannot run answers null, and the caller says "a process this machine would not name" rather than
// inventing one.

import { spawnCaptureAsync } from '../utils/spawnCapture';
import { isPortBindableAsync } from './portCollision';

/** How long the lookup may take before it is abandoned, in milliseconds. */
const LOOKUP_TIMEOUT_MS = 2000;

export interface PortListener {
  pid: number;
  /** The process's command, as the platform tool reported it. Empty when it reported none. */
  command: string;
}

/**
 * The process listening on a TCP port, or null when it cannot be established.
 *
 * Never throws: a machine with no `lsof` is the ordinary case on a minimal container, and the
 * command that asks has a report to print either way.
 */
export async function findPortListenerAsync(port: number): Promise<PortListener | null> {
  try {
    return process.platform === 'win32'
      ? await findWindowsListenerAsync(port)
      : await findPosixListenerAsync(port);
  } catch {
    // "Never throws" is the contract, and it has to hold for the spawn itself as well as for its
    // result: a machine that cannot start `lsof` at all is the same answer as one with no `lsof`.
    return null;
  }
}

/**
 * Whether *something* holds this port, without asking who.
 *
 * The lookup above is best effort, and a null from it means two very different things: the port is
 * quiet, or the port is busy and this machine would not say by whom. `dev:stop` used to report the
 * first for both — "nothing is listening on port 8195" about a port a `python3 -m http.server` was
 * on [observed — friction run 7, F72]. A bind attempt settles it without naming anyone: a port that
 * cannot be bound is a port in use.
 *
 * Only the loopback interface, which is the same interface every other check in `dev:stop` uses.
 *
 * @ref llp/0021-honest-reports.rfc.md §How they show up
 */
export async function isPortInUseAsync(port: number): Promise<boolean> {
  return !(await isPortBindableAsync(port));
}

/** `lsof -nP -iTCP:<port> -sTCP:LISTEN -FpcR` — one field per line, which is the parseable form. */
async function findPosixListenerAsync(port: number): Promise<PortListener | null> {
  const { stdout, exitCode, spawnError } = await spawnCaptureAsync(
    'lsof',
    ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-Fpc'],
    { timeoutMs: LOOKUP_TIMEOUT_MS }
  );
  if (spawnError || exitCode !== 0) {
    return null;
  }
  return parseLsofFields(stdout);
}

/**
 * Read `lsof -F` output: one record per line, the first character naming the field.
 *
 * The field form is used rather than the columns because the columns are whitespace-aligned and a
 * command name with a space in it silently shifts every column after it.
 */
export function parseLsofFields(stdout: string): PortListener | null {
  let pid: number | null = null;
  let command = '';
  for (const line of stdout.split('\n')) {
    const field = line[0];
    const value = line.slice(1).trim();
    if (field === 'p') {
      // A second process on the same port starts a new record; the first listener is the answer.
      if (pid != null) {
        break;
      }
      const parsed = Number(value);
      if (Number.isInteger(parsed) && parsed > 0) {
        pid = parsed;
      }
    } else if (field === 'c' && pid != null) {
      command = value;
    }
  }
  return pid == null ? null : { pid, command };
}

/** `netstat -ano` for the pid, then `tasklist` for what that pid is. */
async function findWindowsListenerAsync(port: number): Promise<PortListener | null> {
  const netstat = await spawnCaptureAsync('netstat', ['-ano'], { timeoutMs: LOOKUP_TIMEOUT_MS });
  if (netstat.spawnError || netstat.exitCode !== 0) {
    return null;
  }
  const pid = parseNetstatListener(netstat.stdout, port);
  if (pid == null) {
    return null;
  }

  const tasklist = await spawnCaptureAsync(
    'tasklist',
    ['/FI', `PID eq ${pid}`, '/FO', 'CSV', '/NH'],
    { timeoutMs: LOOKUP_TIMEOUT_MS }
  );
  const command = tasklist.spawnError
    ? ''
    : (tasklist.stdout.split(',')[0] ?? '').replace(/"/g, '');
  return { pid, command: command.trim() };
}

/** Read the PID of the first LISTENING row for a port out of `netstat -ano`. */
export function parseNetstatListener(stdout: string, port: number): number | null {
  for (const line of stdout.split('\n')) {
    const columns = line.trim().split(/\s+/);
    if (columns.length < 5 || !/^LISTENING$/i.test(columns[3] ?? '')) {
      continue;
    }
    // `127.0.0.1:8081` and `[::]:8081` both end in `:<port>`, and nothing else in the row does.
    if (!(columns[1] ?? '').endsWith(`:${port}`)) {
      continue;
    }
    const pid = Number(columns[4]);
    if (Number.isInteger(pid) && pid > 0) {
      return pid;
    }
  }
  return null;
}

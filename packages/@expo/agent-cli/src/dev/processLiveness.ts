// @ref llp/0004-smart-start-and-project-state.rfc.md §Daemonization
// "Is that process still there?", asked without touching it.
//
// The one question `dev:stop` has to answer to know whether its own signal worked. Everything else
// it can ask — does the port answer, does the lock answer — is about the *port* or about a socket
// file, and either can be true for a reason that has nothing to do with the process that was
// signalled.

/**
 * Whether a pid names a process that exists.
 *
 * Signal `0` is the POSIX existence check: the kernel does the permission and lookup work and
 * delivers nothing. Two error codes, and only one of them means "gone":
 *
 * - `ESRCH` — no such process. Gone.
 * - `EPERM` — a process this user may not signal. That is a process that is *there*, and reading it
 *   as gone would report a stop that did not happen. It is reachable in practice: a dev server
 *   started under `sudo`, or one inherited from another user's session.
 *
 * Windows has no signals, and Node emulates this check there [observed — `process.kill` accepts
 * `0` on win32 and throws `ESRCH` for a pid that is not running], which is the same answer.
 */
export function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error: unknown) {
    return (error as NodeJS.ErrnoException | undefined)?.code === 'EPERM';
  }
}

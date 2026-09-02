// @ref llp/0015-backend-selection-and-config.rfc.md §Resolving the EAS CLI
// Stopping a subprocess **and everything it started**.
//
// The reason this module exists is one line of wave 18: every EAS-backed spawn now goes through a
// package runner (`src/utils/easCli.ts`), so the process this CLI holds a handle to is `npx`, and
// the program that does the work is *its* child. `child.kill()` signals the handle. The grandchild
// survives it, keeps the inherited stdout pipe open — and `'close'` never fires, because it waits
// for EOF on the pipes as well as for the exit. So a deadline that used to stop a tool became a
// deadline that hangs the command it was protecting [observed — 2026-08-27, `deploy`'s prompt-guard
// e2e sat for the whole 45 s test timeout instead of ~1 s].
//
// Every timeout, every prompt guard and every forwarded Ctrl-C is affected, which is why the fix is
// here rather than at one call site.

import { spawnSync, type ChildProcess } from 'child_process';

import { windowsTaskkillCommand } from './windowsShim';

/**
 * Whether a spawn should be put in a process group of its own.
 *
 * POSIX only. `detached` is what creates the group, and a group is what can be signalled as a unit.
 * Windows has no process-group equivalent; {@link killProcessTree} uses `taskkill /T /F` there.
 *
 * Safe for every caller here because **stdin is never attached** (llp/0006 §Surface improvements
 * parity): a detached child is not in the terminal's foreground group, so it could not read a
 * terminal even if it tried, and it never tries. Terminal signals do not reach it either, which is
 * why the callers forward them explicitly — and now forward them to the whole group.
 */
export const USE_PROCESS_GROUP = process.platform !== 'win32';

/**
 * Signal a child and everything it started.
 *
 * The negative pid is the whole group. It can fail for two ordinary reasons — the child is already
 * gone (`ESRCH`), or it never started and has no pid — and both mean there is nothing to signal, so
 * the fallback is the plain kill and a failure there is nothing either.
 */
export function killProcessTree(child: ChildProcess, signal?: NodeJS.Signals): void {
  if (USE_PROCESS_GROUP && child.pid != null) {
    try {
      process.kill(-child.pid, signal ?? 'SIGTERM');
      return;
    } catch {
      // Already gone, or never in a group of its own. The direct kill below is the honest fallback.
    }
  }
  if (process.platform === 'win32' && child.pid != null) {
    // `child.kill()` signals cmd.exe when the spawn went through a shell; `/T` takes the tree.
    try {
      const killed = spawnSync(windowsTaskkillCommand(), ['/PID', String(child.pid), '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true,
      });
      if (killed?.status === 0) {
        return;
      }
    } catch {
      // taskkill missing, or spawnSync could not run. Direct kill is the fallback.
    }
  }
  try {
    child.kill(signal ?? 'SIGTERM');
  } catch {
    // A child that cannot be signalled is a child that is not running.
  }
}

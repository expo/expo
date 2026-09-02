// @ref llp/0015-backend-selection-and-config.rfc.md §Resolving the EAS CLI — the single rung.
// @ref llp/0021-honest-reports.rfc.md §The rules.
//
// One spawn of a package spec at a time, per process.
//
// Wave 18 made the package runner the only rung to the EAS CLI, which fixed the impostor class and
// brought one property of the runners with it: **a runner keeps a scratch directory per package
// spec**. `bunx eas-cli@latest` resolves and installs into `$TMPDIR/bunx-<uid>-eas-cli@latest`, and
// two `bunx` processes started milliseconds apart on the same spec are two writers of one directory.
// The loser does not queue. It exits 1 with empty stdout and bun's own progress on stderr —
// `Resolving dependencies` — which the caller then reports as what the *service* said about its
// builds.
//
// Observed [F93, live tier, 2026-08-27], six runs of `@expo/agent-cli status --explain` against a fresh copy
// of an EAS-linked project with no `.expo` cache: both platforms poisoned 2/6, one platform poisoned
// 1/6, clean 3/6. The identical argv run on its own exits 0 with the correct payload every time, and
// a ~50 ms skew between the two spawns made the collision disappear.
//
// **Why a mutex and not isolated caches** [decided — wave 22]. Three fixes were on the table:
//
//  1. A per-spec mutex in the spawn layer — this module.
//  2. A private cache directory per spawn (`BUN_INSTALL_CACHE_DIR`, `npm_config_cache`).
//  3. One resolution up front, then reuse of its result.
//
// (2) buys concurrency and pays for it in the one thing the runner rung exists to give: a warm cache.
// A private cache is cold by construction, so **every** lookup would download the CLI — the cost
// llp/0015 §Resolving the EAS CLI is careful to make a once-per-machine cost, turned into a
// per-spawn one. It is also a claim about two other tools' undocumented environment variables, which
// is the kind of claim llp/0002 will not let this CLI ship untested. (3) is a larger change than the
// defect: the specs differ per project and per caller, and "resolve once" needs a place to put the
// answer that outlives the process.
//
// (1) is the smallest fix that is honest about what it does. It serializes **only** spawns that share
// a scratch directory: two different specs still run concurrently, and nothing that is not a runner is
// touched at all. What it costs is the wall time of the second spawn, which for the case that found
// this is about a second on a command that opted into a network call.
//
// **Where it is applied.** All three spawn paths that can start a runner, because "the fix holds for
// status's two lookups" is not the claim worth making: `src/utils/subprocess.ts` (the EAS lookups,
// deploy, doctor, typecheck, config, auth, `create-expo`), `src/utils/spawnCapture.ts` (the cloud
// simulator's verbs) and `src/utils/inheritedRun.ts` (the `npx expo` fallback). A path that grows a
// fourth spawn helper has to come through here too, which is why the key is derived from the argv
// rather than passed in by each caller.

/** Runner names, without extension, whose scratch directory is shared per package spec. */
const RUNNER_NAMES = new Set(['npx', 'bunx']);

/** Executable suffixes a runner is spelled with on Windows. */
const EXECUTABLE_SUFFIXES = ['.cmd', '.exe', '.bat', '.ps1'];

/** The spec placeholder for a runner argv this module cannot read a package out of. */
const UNKNOWN_SPEC = '*';

/**
 * Which runner an executable is, or null when it is not one.
 *
 * The **base name**, because the path is not the thing that collides: `bunx` found at
 * `/opt/homebrew/bin/bunx` and a bare `bunx` share one scratch directory, and two locks for them
 * would be no lock at all.
 */
function runnerNameOf(command: string): string | null {
  // Split on both separators whatever the platform, because a Windows path may be carried on a test
  // running elsewhere and a name is cheap to be right about.
  const base = command.split(/[\\/]/).pop() ?? command;
  const lower = base.toLowerCase();
  const suffix = EXECUTABLE_SUFFIXES.find((extension) => lower.endsWith(extension));
  const name = suffix ? lower.slice(0, -suffix.length) : lower;
  return RUNNER_NAMES.has(name) ? name : null;
}

/**
 * The package spec a runner argv names, or null when nothing in it looks like one.
 *
 * The first argument that is not a flag. That is the whole rule, and it is enough because this CLI
 * writes exactly one runner flag onto a runner's command line — `--yes`, for npx's install prompt
 * (`src/utils/easCli.ts`) — and both runners take the spec immediately after their own flags.
 *
 * A flag that takes a **separate value** would break the rule, and none is written here; a spelling
 * this cannot read answers null and is serialized under {@link UNKNOWN_SPEC}, which over-serializes
 * rather than under-serializes. That asymmetry is deliberate: the cost of the first is a moment, and
 * the cost of the second is F93 back.
 */
function packageSpecOf(args: readonly string[]): string | null {
  for (const arg of args) {
    if (!arg.startsWith('-')) {
      return arg;
    }
  }
  return null;
}

/**
 * The lock key for one spawn, or null when the spawn is not a package runner at all.
 *
 * `<runner>:<spec>`. Keyed on the runner as well as the spec because the two runners keep separate
 * scratch directories — `npx eas-cli@latest` and `bunx eas-cli@latest` do not collide — so folding
 * them together would serialize a pair that never had a problem.
 */
export function runnerSpawnKey(command: string, args: readonly string[]): string | null {
  const runner = runnerNameOf(command);
  if (runner == null) {
    return null;
  }
  return `${runner}:${packageSpecOf(args) ?? UNKNOWN_SPEC}`;
}

/** The lock one spawn holds. Released exactly once, in a `finally`. */
export interface RunnerLock {
  /** How long this spawn waited for the runner ahead of it, in milliseconds. */
  queuedMs: number;
  /** Hand the lock to the next waiter, or leave it free. Calling it twice is a no-op. */
  release(): void;
}

/** One key's state: whether it is held, and who is waiting in the order they arrived. */
interface Queue {
  held: boolean;
  waiting: ((granted: boolean) => void)[];
}

const queues = new Map<string, Queue>();

/** Forget every lock and every waiter. For tests, and for nothing else. */
export function resetRunnerLocks(): void {
  queues.clear();
}

function queueFor(key: string): Queue {
  let queue = queues.get(key);
  if (!queue) {
    queue = { held: false, waiting: [] };
    queues.set(key, queue);
  }
  return queue;
}

function lockFor(queue: Queue, queuedMs: number): RunnerLock {
  let released = false;
  return {
    queuedMs,
    release() {
      if (released) {
        return;
      }
      released = true;
      const next = queue.waiting.shift();
      if (next) {
        // Held straight through the handover: dropping `held` between two waiters would let a third
        // acquisition walk past the queue.
        next(true);
        return;
      }
      queue.held = false;
    },
  };
}

/**
 * Take the lock **now**, or answer null because somebody holds it.
 *
 * Synchronous, and that is load-bearing rather than an optimisation: `spawnSubprocessAsync` starts
 * the child in the same tick it is called in, and callers rely on it — a `.then` on the returned
 * promise runs after the process exists, and the tests of the spawn layer emit on the child they
 * mocked without awaiting anything. An `await` on an uncontended lock would move the spawn to a
 * microtask and quietly change that contract for every caller, to buy nothing.
 */
export function tryAcquireRunnerLock(key: string): RunnerLock | null {
  const queue = queueFor(key);
  if (queue.held) {
    return null;
  }
  queue.held = true;
  return lockFor(queue, 0);
}

/**
 * Take the lock for one package spec, waiting for whoever holds it.
 *
 * @param timeoutMs how long to wait before giving up. Unbounded when omitted — which is right for a
 * spawn that has no deadline of its own, and wrong for one that has: a caller who promised to answer
 * within a budget must not spend it invisibly in a queue. Every runner spawn this CLI makes under a
 * deadline passes it.
 * @returns the lock, or null when the wait expired. Null is not an error: the caller reports it as
 * the timeout it is, and the queue is left intact for whoever is behind.
 */
export function acquireRunnerLockAsync(
  key: string,
  { timeoutMs }: { timeoutMs?: number } = {}
): Promise<RunnerLock | null> {
  const free = tryAcquireRunnerLock(key);
  if (free) {
    return Promise.resolve(free);
  }
  const queue = queueFor(key);

  const startedAt = Date.now();
  return new Promise<RunnerLock | null>((resolve) => {
    let settled = false;
    let timer: NodeJS.Timeout | undefined;

    const grant = (granted: boolean) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      resolve(granted ? lockFor(queue, Date.now() - startedAt) : null);
    };

    queue.waiting.push(grant);

    if (timeoutMs != null) {
      timer = setTimeout(() => {
        // Out of the queue first, so the holder's `release` never hands the baton to a waiter that
        // has already given up — which would leave the lock held by nobody.
        const index = queue.waiting.indexOf(grant);
        if (index >= 0) {
          queue.waiting.splice(index, 1);
        }
        grant(false);
      }, timeoutMs);
      // An unreferenced timer never keeps this process alive on its own.
      timer.unref?.();
    }
  });
}

/**
 * Run `work` holding the lock for one package spec.
 *
 * The unbounded form, for a caller with nothing to report a timeout as. A caller that has a deadline
 * uses {@link acquireRunnerLockAsync} and reports the null.
 */
export function withRunnerLockAsync<T>(key: string, work: () => Promise<T>): Promise<T> {
  // The free case starts `work` in this tick, for the reason `tryAcquireRunnerLock` gives.
  const free = tryAcquireRunnerLock(key);
  if (free) {
    return runAndRelease(free, work);
  }
  return acquireRunnerLockAsync(key).then((lock) => runAndRelease(lock!, work));
}

async function runAndRelease<T>(lock: RunnerLock, work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } finally {
    lock.release();
  }
}

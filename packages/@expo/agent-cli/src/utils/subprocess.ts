// @ref llp/0001-agentic-cli-on-expo-cli.rfc.md §Constraints — every other CLI of the Expo family
// is reached across a process boundary. `expoCli.ts` covers the project's `expo` bin; this module
// covers the ones `@expo/agent-cli` has to find for itself (`create-expo`, `eas`) and the two output modes
// a command needs: hand the terminal over, or capture what the tool printed.
import { spawn } from 'child_process';
import path from 'path';

import { isPromptShaped, lastNonEmptyLine } from '../needsHuman/detect';
import { fileExistsSync } from './dir';
import { env } from './env';
import { killProcessTree, USE_PROCESS_GROUP } from './processGroup';
import { acquireRunnerLockAsync, runnerSpawnKey, tryAcquireRunnerLock } from './runnerLock';
import { resolveSpawnTarget } from './windowsShim';

/** What happens to the output of the subprocess. */
export type SubprocessOutput =
  /** The child writes straight to this process' streams. Nothing is captured. */
  | 'inherit'
  /** The output is collected and never printed, for a command that owns stdout (`--json`). */
  | 'capture'
  /** The output is printed as it arrives *and* collected, for a result parsed out of it. */
  | 'tee'
  /**
   * Both streams are collected, and only stderr is printed as it arrives.
   *
   * For a tool that answers on stdout and reports progress on stderr (`create-launch --json`): the
   * answer has to be parsed rather than printed, the progress belongs on the terminal while it
   * happens, and it still has to be *kept*, because a tool that fails says why on the same stream.
   */
  | 'capture-stdout';

/** The output modes that keep what the tool printed, i.e. everything but `inherit`. */
export type CapturedOutput = Exclude<SubprocessOutput, 'inherit'>;

export interface SubprocessOptions {
  cwd?: string;
  /** Defaults to `capture`. */
  output?: SubprocessOutput;
  /**
   * Environment for the child, merged over this process' own.
   *
   * The one thing it is for is saying "nobody can answer you" in the way each tool understands —
   * `CI=1` for the Expo CLI (llp/0010 §Needs-human protocol, layer 2). Everything else a tool
   * reads it inherits, because a subprocess of `@expo/agent-cli` is meant to behave like the same command
   * run by hand.
   */
  env?: NodeJS.ProcessEnv;
  /**
   * Kill the child when it goes silent on a prompt-shaped line, instead of waiting forever.
   *
   * Off unless a caller asks for it, and never in `inherit` mode, where a prompt is legitimate
   * because a person is watching. See {@link SubprocessResult.promptHang}.
   */
  promptGuard?: boolean;
  /**
   * Kill the child after this long, whatever it is doing.
   *
   * For a question whose answer is only worth a moment — "who is this machine signed in as", asked
   * by a command that promises to be instant. A tool that is doing the work it was asked to do
   * gets no deadline. See {@link SubprocessResult.timedOut}.
   */
  timeoutMs?: number;
  /**
   * Rewrite or drop each line before it is printed. What is *captured* is never touched.
   *
   * For a tool whose output is written for a terminal that this run does not have — a spinner
   * animation with no cursor to move, or a "what to do next" block the wrapper is about to answer
   * better itself. Returning `null` drops the line.
   *
   * Only in the printing modes, and only with a filter: printing is line-buffered while one is
   * set, because a filter cannot decide about half a line. Without one, the bytes reach the
   * terminal exactly as they arrive.
   */
  printFilter?: (line: string) => string | null;
}

export interface SubprocessResult {
  /** Exit code, or `null` when the process could never be started. */
  exitCode: number | null;
  /** Empty in `inherit` mode, where this process never sees the output. */
  stdout: string;
  stderr: string;
  /** Set when the binary could not be spawned at all, e.g. it is not on `PATH`. */
  spawnError?: NodeJS.ErrnoException;
  /**
   * The question the child was killed on, when `promptGuard` fired.
   *
   * Untrusted text: it is whatever the tool printed, and it is quoted rather than acted on.
   */
  promptHang?: string;
  /** Set when the child was killed for running past `timeoutMs`. */
  timedOut?: boolean;
}

/** Signals the terminal delivers to the whole process group, so the child gets them too. */
const TERMINAL_SIGNALS: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];

/**
 * Run another CLI and wait for it to finish.
 *
 * Never rejects: a non-zero exit code and a missing binary are both results the caller reports,
 * so the message can name the tool instead of the exception.
 *
 * **stdin is never attached.** Zero TTY is the contract of every command here (llp/0006
 * §Non-interactive parity): a tool that decides to prompt gets EOF and fails fast, instead of
 * hanging a pipe an agent is waiting on.
 *
 * Terminal signals are forwarded while the child runs, the same way `runExpoAsync` does it, so
 * killing `@expo/agent-cli` stops the cloud build or the deploy it is waiting for rather than orphaning
 * it. An interrupt resolves as a clean exit, because the stop was asked for.
 *
 * **A package runner waits its turn** (`./runnerLock.ts`, F93): two spawns of one package spec share
 * the runner's scratch directory, and the loser of that race exits 1 with the runner's own progress
 * output — which the caller then reports as the service's answer. Nothing that is not a runner is
 * affected, and two different specs still run at once.
 */
export function spawnSubprocessAsync(
  command: string,
  args: string[],
  options: SubprocessOptions = {}
): Promise<SubprocessResult> {
  const key = runnerSpawnKey(command, args);
  if (key == null) {
    return spawnNowAsync(command, args, options);
  }
  // Nothing is holding it: spawn in this tick, the way every caller of this function has always
  // been able to rely on (`./runnerLock.ts` §tryAcquireRunnerLock).
  const free = tryAcquireRunnerLock(key);
  if (free) {
    return spawnNowAsync(command, args, options).finally(() => free.release());
  }
  return queuedSpawnAsync(key, command, args, options);
}

/** The contended case: wait for the runner ahead, then spawn with what is left of the budget. */
async function queuedSpawnAsync(
  key: string,
  command: string,
  args: string[],
  options: SubprocessOptions
): Promise<SubprocessResult> {
  const lock = await acquireRunnerLockAsync(key, { timeoutMs: options.timeoutMs });
  if (lock == null) {
    // The queue is part of the budget, so running out in it is the same outcome as running out in
    // the spawn: a caller that promised an answer within a deadline reports that it did not get one.
    return { exitCode: null, stdout: '', stderr: '', timedOut: true };
  }
  try {
    return await spawnNowAsync(command, args, {
      ...options,
      // What is left of the deadline after the wait. A spawn that queued for a second has a second
      // less, because the caller's promise was about the whole call and not about the child.
      timeoutMs:
        options.timeoutMs == null ? undefined : Math.max(1, options.timeoutMs - lock.queuedMs),
    });
  } finally {
    lock.release();
  }
}

/** Spawn now, with no regard for what else is running. The body of the function above. */
function spawnNowAsync(
  command: string,
  args: string[],
  {
    cwd,
    output = 'capture',
    env: childEnv,
    promptGuard,
    timeoutMs,
    printFilter,
  }: SubprocessOptions = {}
): Promise<SubprocessResult> {
  return new Promise<SubprocessResult>((resolve) => {
    // `eas`, `create-expo` and `npx` all resolve to a batch shim on Windows, which needs `cmd.exe`.
    const target = resolveSpawnTarget(command, args);
    const child = spawn(target.command, target.args, {
      cwd,
      stdio: stdioFor(output),
      shell: target.shell,
      // Its own process group, so a deadline or the prompt guard can stop the whole tree. What this
      // spawns is usually a package runner, and the program that does the work is the runner's
      // child (`src/utils/processGroup.ts`).
      detached: USE_PROCESS_GROUP,
      // Only when there is something to add: `undefined` is what makes the child inherit, and
      // spelling out `process.env` here would freeze a copy for no reason.
      ...(childEnv ? { env: { ...process.env, ...childEnv } } : null),
    });

    let stdout = '';
    let stderr = '';
    /** Set when the guard below kills the child, so `close` knows why it is closing. */
    let promptHang: string | undefined;
    /** Set when the deadline below kills the child, for the same reason. */
    let timedOut = false;

    const deadline = timeoutMs
      ? setTimeout(() => {
          timedOut = true;
          killProcessTree(child);
        }, timeoutMs)
      : undefined;
    deadline?.unref?.();

    // Layer 4 of the needs-human detection (llp/0010 §Needs-human protocol). Nothing is captured
    // in `inherit` mode, so there is no last line to look at and no reason to look: a person has
    // the terminal.
    const guard =
      promptGuard && output !== 'inherit'
        ? startPromptGuard({
            idleMs: env.AGENT_CLI_PROMPT_TIMEOUT_MS,
            lastOutput: () => stderr || stdout,
            onHang: (line) => {
              promptHang = line;
              killProcessTree(child);
            },
          })
        : null;

    // Line-buffered only when a filter is set: a filter cannot decide about half a line, and a
    // caller without one must keep the byte-for-byte passthrough it has always had.
    const toOut = printerFor(process.stdout, printFilter);
    const toErr = printerFor(process.stderr, printFilter);

    child.stdout?.on('data', (chunk) => {
      const text = chunk.toString();
      stdout += text;
      guard?.sawOutput();
      if (output === 'tee') {
        toOut.write(text);
      }
    });
    child.stderr?.on('data', (chunk) => {
      const text = chunk.toString();
      stderr += text;
      guard?.sawOutput();
      if (output === 'tee' || output === 'capture-stdout') {
        toErr.write(text);
      }
    });

    const listeners = TERMINAL_SIGNALS.map((signal) => {
      const forward = () => {
        killProcessTree(child, signal);
      };
      process.on(signal, forward);
      return { signal, forward } as const;
    });
    const stopWatching = () => {
      guard?.stop();
      clearTimeout(deadline);
      // A tool that ends without a trailing newline still said what it said.
      toOut.flush();
      toErr.flush();
      for (const { signal, forward } of listeners) {
        process.off(signal, forward);
      }
    };

    child.on('error', (spawnError: NodeJS.ErrnoException) => {
      stopWatching();
      resolve({ exitCode: null, stdout, stderr, spawnError });
    });

    child.on('close', (code, signal) => {
      stopWatching();
      // A child this process killed on a prompt reports no code of its own, and the stop was not
      // asked for, so it must not read as the clean interrupt below.
      if (promptHang != null) {
        resolve({ exitCode: code, stdout, stderr, promptHang });
        return;
      }
      if (timedOut) {
        resolve({ exitCode: code, stdout, stderr, timedOut: true });
        return;
      }
      const exitCode = code ?? (signal === 'SIGINT' || signal === 'SIGTERM' ? 0 : 1);
      resolve({ exitCode, stdout, stderr });
    });
  });
}

/**
 * Where the printed half of a captured run goes.
 *
 * Without a filter this is `stream.write`, unchanged and unbuffered. With one, whole lines are
 * handed over one at a time — the filter's unit — and whatever the tool left without a trailing
 * newline is flushed when it exits.
 */
function printerFor(
  stream: NodeJS.WriteStream,
  filter: ((line: string) => string | null) | undefined
): { write(text: string): void; flush(): void } {
  if (!filter) {
    return {
      write(text: string) {
        stream.write(text);
      },
      flush() {},
    };
  }

  let pending = '';
  const emit = (line: string) => {
    const printed = filter(line);
    if (printed != null) {
      stream.write(`${printed}\n`);
    }
  };

  return {
    write(text: string) {
      pending += text;
      const lines = pending.split('\n');
      // The last piece is whatever came after the final newline, which is not a line yet.
      pending = lines.pop() ?? '';
      for (const line of lines) {
        emit(line);
      }
    },
    flush() {
      if (pending) {
        emit(pending);
        pending = '';
      }
    },
  };
}

/**
 * Watch for a child that stopped writing while its last line was a question.
 *
 * Both halves are required. Silence on its own is a long build or a slow upload, and killing that
 * would be worse than the hang it prevents; a question on its own is a tool that asked and moved
 * on. Together they are the one thing a subprocess with no stdin can never recover from — and
 * because the window is the whole risk, `AGENT_CLI_PROMPT_TIMEOUT_MS` can widen it.
 */
function startPromptGuard({
  idleMs,
  lastOutput,
  onHang,
}: {
  idleMs: number;
  lastOutput: () => string;
  onHang: (line: string) => void;
}): { sawOutput(): void; stop(): void } {
  let timer: NodeJS.Timeout | undefined;

  const arm = () => {
    timer = setTimeout(() => {
      const line = lastNonEmptyLine(lastOutput());
      if (line != null && isPromptShaped(line)) {
        onHang(line);
        return;
      }
      // Silent, but not on a question: keep waiting, and look again after another window.
      arm();
    }, idleMs);
    // An unreferenced timer never keeps this process alive on its own.
    timer.unref?.();
  };

  arm();
  return {
    sawOutput() {
      clearTimeout(timer);
      arm();
    },
    stop() {
      clearTimeout(timer);
    },
  };
}

/** How the three standard streams of the child are wired for one output mode. */
function stdioFor(output: SubprocessOutput): ('ignore' | 'inherit' | 'pipe')[] {
  // Anything that is captured has to be piped; only a fully inherited run hands the streams over.
  return output === 'inherit' ? ['ignore', 'inherit', 'inherit'] : ['ignore', 'pipe', 'pipe'];
}

/** Filename variants of one command, in the order a shell would try them on this platform. */
function executableNames(name: string): string[] {
  return process.platform === 'win32' ? [`${name}.cmd`, `${name}.exe`, name] : [name];
}

/**
 * Find a command on `PATH` without spawning anything.
 *
 * `which`/`where` would be a subprocess for a question two `stat` calls answer, and a command
 * that has to *report* which binary it is about to run (`@expo/agent-cli deploy` names the `eas` it
 * found) needs the path, not just a yes.
 *
 * @param pathEnv `PATH` to search, for tests that must not depend on the machine's own.
 * @returns the absolute path of the executable, or `null` when no entry of `PATH` holds it.
 */
export function findExecutableOnPath(
  name: string,
  { pathEnv = process.env.PATH }: { pathEnv?: string } = {}
): string | null {
  for (const dir of (pathEnv ?? '').split(path.delimiter)) {
    if (!dir) {
      continue;
    }
    for (const fileName of executableNames(name)) {
      const candidate = path.join(dir, fileName);
      if (fileExistsSync(candidate)) {
        return candidate;
      }
    }
  }
  return null;
}

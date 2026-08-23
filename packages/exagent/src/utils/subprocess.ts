// @ref llp/0001-agentic-cli-on-expo-cli.rfc.md §Constraints — every other CLI of the Expo family
// is reached across a process boundary. `expoCli.ts` covers the project's `expo` bin; this module
// covers the ones `exagent` has to find for itself (`create-expo`, `eas`) and the two output modes
// a command needs: hand the terminal over, or capture what the tool printed.
import { spawn } from 'child_process';
import path from 'path';

import { isPromptShaped, lastNonEmptyLine } from '../needsHuman/detect';
import { fileExistsSync } from './dir';
import { env } from './env';
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

export interface SubprocessOptions {
  cwd?: string;
  /** Defaults to `capture`. */
  output?: SubprocessOutput;
  /**
   * Environment for the child, merged over this process' own.
   *
   * The one thing it is for is saying "nobody can answer you" in the way each tool understands —
   * `CI=1` for the Expo CLI (llp/0010 §Needs-human protocol, layer 2). Everything else a tool
   * reads it inherits, because a subprocess of `exagent` is meant to behave like the same command
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
 * killing `exagent` stops the cloud build or the deploy it is waiting for rather than orphaning
 * it. An interrupt resolves as a clean exit, because the stop was asked for.
 */
export function spawnSubprocessAsync(
  command: string,
  args: string[],
  { cwd, output = 'capture', env: childEnv, promptGuard }: SubprocessOptions = {}
): Promise<SubprocessResult> {
  return new Promise<SubprocessResult>((resolve) => {
    // `eas`, `create-expo` and `npx` all resolve to a batch shim on Windows, which needs `cmd.exe`.
    const target = resolveSpawnTarget(command, args);
    const child = spawn(target.command, target.args, {
      cwd,
      stdio: stdioFor(output),
      shell: target.shell,
      // Only when there is something to add: `undefined` is what makes the child inherit, and
      // spelling out `process.env` here would freeze a copy for no reason.
      ...(childEnv ? { env: { ...process.env, ...childEnv } } : null),
    });

    let stdout = '';
    let stderr = '';
    /** Set when the guard below kills the child, so `close` knows why it is closing. */
    let promptHang: string | undefined;

    // Layer 4 of the needs-human detection (llp/0010 §Needs-human protocol). Nothing is captured
    // in `inherit` mode, so there is no last line to look at and no reason to look: a person has
    // the terminal.
    const guard =
      promptGuard && output !== 'inherit'
        ? startPromptGuard({
            idleMs: env.EXAGENT_PROMPT_TIMEOUT_MS,
            lastOutput: () => stderr || stdout,
            onHang: (line) => {
              promptHang = line;
              child.kill();
            },
          })
        : null;

    child.stdout?.on('data', (chunk) => {
      const text = chunk.toString();
      stdout += text;
      guard?.sawOutput();
      if (output === 'tee') {
        process.stdout.write(text);
      }
    });
    child.stderr?.on('data', (chunk) => {
      const text = chunk.toString();
      stderr += text;
      guard?.sawOutput();
      if (output === 'tee' || output === 'capture-stdout') {
        process.stderr.write(text);
      }
    });

    const listeners = TERMINAL_SIGNALS.map((signal) => {
      const forward = () => {
        child.kill(signal);
      };
      process.on(signal, forward);
      return { signal, forward } as const;
    });
    const stopWatching = () => {
      guard?.stop();
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
      const exitCode = code ?? (signal === 'SIGINT' || signal === 'SIGTERM' ? 0 : 1);
      resolve({ exitCode, stdout, stderr });
    });
  });
}

/**
 * Watch for a child that stopped writing while its last line was a question.
 *
 * Both halves are required. Silence on its own is a long build or a slow upload, and killing that
 * would be worse than the hang it prevents; a question on its own is a tool that asked and moved
 * on. Together they are the one thing a subprocess with no stdin can never recover from — and
 * because the window is the whole risk, `EXAGENT_PROMPT_TIMEOUT_MS` can widen it.
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
 * that has to *report* which binary it is about to run (`exagent deploy` names the `eas` it
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

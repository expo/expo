// @ref llp/0001-agentic-cli-on-expo-cli.rfc.md §Constraints — every other CLI of the Expo family
// is reached across a process boundary. `expoCli.ts` covers the project's `expo` bin; this module
// covers the ones `exagent` has to find for itself (`create-expo`, `eas`) and the two output modes
// a command needs: hand the terminal over, or capture what the tool printed.
import { spawn } from 'child_process';
import path from 'path';

import { fileExistsSync } from './dir';
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
}

export interface SubprocessResult {
  /** Exit code, or `null` when the process could never be started. */
  exitCode: number | null;
  /** Empty in `inherit` mode, where this process never sees the output. */
  stdout: string;
  stderr: string;
  /** Set when the binary could not be spawned at all, e.g. it is not on `PATH`. */
  spawnError?: NodeJS.ErrnoException;
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
  { cwd, output = 'capture' }: SubprocessOptions = {}
): Promise<SubprocessResult> {
  return new Promise<SubprocessResult>((resolve) => {
    // `eas`, `create-expo` and `npx` all resolve to a batch shim on Windows, which needs `cmd.exe`.
    const target = resolveSpawnTarget(command, args);
    const child = spawn(target.command, target.args, {
      cwd,
      stdio: stdioFor(output),
      shell: target.shell,
    });

    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (chunk) => {
      const text = chunk.toString();
      stdout += text;
      if (output === 'tee') {
        process.stdout.write(text);
      }
    });
    child.stderr?.on('data', (chunk) => {
      const text = chunk.toString();
      stderr += text;
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
    const stopForwardingSignals = () => {
      for (const { signal, forward } of listeners) {
        process.off(signal, forward);
      }
    };

    child.on('error', (spawnError: NodeJS.ErrnoException) => {
      stopForwardingSignals();
      resolve({ exitCode: null, stdout, stderr, spawnError });
    });

    child.on('close', (code, signal) => {
      stopForwardingSignals();
      const exitCode = code ?? (signal === 'SIGINT' || signal === 'SIGTERM' ? 0 : 1);
      resolve({ exitCode, stdout, stderr });
    });
  });
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

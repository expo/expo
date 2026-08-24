// @ref llp/0001-agentic-cli-on-expo-cli.rfc.md §Constraints — every CLI of the family is reached
// across a process boundary, which means the thing on the other side is whatever the machine has
// under that name. Usually it is the CLI. Sometimes it is a wrapper, a shim, a stale symlink or a
// binary from another project entirely, and then the bytes it printed are not Expo output at all.
//
// Quoting those bytes under "What the tool printed" is worse than printing nothing: it tells the
// reader that the EAS CLI reported a missing file, and an agent then goes looking for that file.
// This module is the one guard against that — a conservative test for "the process did not run as
// the CLI at all", and the sentence to print instead.
//
// Conservative on purpose. A false positive hides real output from a real failure, so both halves
// have to agree: the output must hold *nothing* that looks like the CLI's, **and** the process
// must have died the way a wrapper dies (a panic, or one of the shell's own "could not run it"
// codes).

import path from 'path';

/** Which CLI was supposed to be on the other side of the spawn. */
export type WrapperCrashTool = 'eas' | 'expo';

/**
 * Fragments that only appear in output the Expo family produced.
 *
 * The bar is "would a wrapper print this by accident", not "does every failure contain one": a
 * miss here costs a slightly vaguer error, while a hit on foreign output costs the whole guard.
 */
const CLI_MARKERS: Record<WrapperCrashTool, RegExp[]> = {
  eas: [/\beas[\s-]/i, /\bexpo\b/i, /expo\.dev/i, /EXPO_TOKEN/],
  expo: [/\bexpo\b/i, /\bmetro\b/i, /CommandError/, /EXPO_TOKEN/],
};

/**
 * How a process that is not the CLI dies.
 *
 * A Rust wrapper panics and prints a backtrace; a native binary aborts or segfaults; a shell that
 * cannot find or execute the target says so with a code and no output at all.
 */
const CRASH_SIGNATURES = [
  /Stack backtrace:/i,
  /panicked at/i,
  /RUST_BACKTRACE/,
  /Segmentation fault/i,
  /Abort trap/i,
  /core dumped/i,
];

/**
 * Exit codes that mean the process never ran as the program it was named for.
 *
 * `101` is the Rust panic code, `126`/`127` are the shell's "cannot execute" and "not found", and
 * `134`/`139` are `SIGABRT` and `SIGSEGV` as a shell reports them.
 */
const CRASH_EXIT_CODES = new Set([101, 126, 127, 134, 139]);

export interface WrapperCrashInput {
  tool: WrapperCrashTool;
  exitCode: number | null;
  stdout: string;
  stderr: string;
}

/**
 * Whether a failed spawn looks like the binary was never the CLI.
 *
 * Both halves are required, which is what keeps a real failure's output on screen: a real CLI
 * failure names its own tool somewhere in the hundreds of bytes it printed, and a real CLI does
 * not exit `101`.
 */
export function looksLikeWrapperCrash({
  tool,
  exitCode,
  stdout,
  stderr,
}: WrapperCrashInput): boolean {
  if (exitCode === 0 || exitCode == null) {
    // A clean exit is not a crash, and a process that never started is reported as a spawn error
    // by the caller, with the errno that explains it.
    return false;
  }

  const output = `${stderr}\n${stdout}`;
  if (CLI_MARKERS[tool].some((marker) => marker.test(output))) {
    return false;
  }

  return CRASH_EXIT_CODES.has(exitCode) || CRASH_SIGNATURES.some((sig) => sig.test(output));
}

/**
 * What to print instead of the tool's output, when the tool was not the tool.
 *
 * Names the path, because that is the one fact that resolves this: the reader has to look at the
 * file that ran, not at the package they believe they installed.
 */
export function wrapperCrashDetail(
  { tool, exitCode }: Pick<WrapperCrashInput, 'tool' | 'exitCode'>,
  binPath: string
): string {
  return [
    ``,
    `What ran instead:`,
    `The ${tool} at ${binPath} failed to run at all (this may not be the real CLI): it exited with code ${exitCode} and printed nothing an ${tool} run would print.`,
    `Check that file — a wrapper script, a shim, or a stale link under that name will fail this way however the command is spelled.`,
  ].join('\n');
}

/**
 * The command that reproduces a failure against the binary that actually ran.
 *
 * `npx eas-cli whoami` checks a *different* program than the one that just failed, so a reader who
 * runs it may see a healthy answer from a package that was never involved. The path is quoted when
 * it holds a space, so the line can be pasted.
 */
export function checkBinaryCommand(binPath: string, args: string[]): string {
  const quoted = /\s/.test(binPath) ? `"${binPath}"` : binPath;
  return [quoted, ...args].join(' ');
}

/** The bare file name of a resolved binary, for a sentence that names it without the path. */
export function binaryName(binPath: string): string {
  return path.basename(binPath);
}

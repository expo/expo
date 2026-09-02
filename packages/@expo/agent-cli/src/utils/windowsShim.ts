import fs from 'fs';
import path from 'path';

// @ref llp/0001-agentic-cli-on-expo-cli.rfc.md §Constraints — the Expo CLI family is invoked as
// subprocesses, so how a platform starts a process is this package's problem.
//
// Windows cannot execute a batch file: `CreateProcess` only runs real images, and every package bin
// npm or pnpm installs on Windows *is* a batch file (`node_modules\.bin\expo.cmd`). Node used to
// paper over that; since the fix for CVE-2024-27980 (Node 18.20, 20.12, 21.7) `spawn` throws
// `EINVAL` for a `.cmd`/`.bat` target unless a shell is asked for. So on Windows every Expo-family
// CLI has to be started through `cmd.exe`, which is what this module works out.

/** Extensions of the shims npm and pnpm write for a package bin on Windows. */
const BATCH_FILE = /\.(cmd|bat)$/i;

export interface SpawnTarget {
  command: string;
  args: string[];
  /** Pass straight to `spawn`: true only for a target that needs `cmd.exe` to run at all. */
  shell: boolean;
}

/**
 * Turn a resolved command into one this platform can actually spawn.
 *
 * Everything but a Windows batch file is left exactly as it is: a shell would add a process, a
 * quoting rule and an injection surface to a spawn that already works.
 *
 * For a batch file the target becomes `cmd.exe /d /s /c "<command> <args...>"`, which Node builds
 * from `shell: true`. Node then sets `windowsVerbatimArguments` and quotes **nothing**, so every
 * part is quoted here instead; `/s` strips the outer pair `cmd` is handed, leaving the quoted
 * program and the quoted arguments it needs to see.
 */
export function resolveSpawnTarget(command: string, args: string[]): SpawnTarget {
  if (process.platform !== 'win32') {
    return { command, args, shell: false };
  }

  // A bare `npx` or `xcrun` is a `.cmd` shim once PATH/PATHEXT has answered. Resolve it here so
  // the batch-file rule below sees the shim, rather than leaving `spawn` to find it without a shell
  // and throw EINVAL (CVE-2024-27980).
  const resolved = resolveBareCommandOnPath(command);
  if (!BATCH_FILE.test(resolved)) {
    return { command: resolved, args, shell: false };
  }

  return {
    command: quotePathForCmd(resolved),
    args: args.map(escapeArgumentForCmd),
    shell: true,
  };
}

/**
 * The file PATH would start for a bare name, or the name itself when nothing matches.
 *
 * Kept here rather than imported from `subprocess.ts` so this module does not import the file that
 * imports it.
 */
function resolveBareCommandOnPath(command: string): string {
  if (/[\\/]/.test(command)) {
    return command;
  }
  const pathEnv = process.env.PATH ?? process.env.Path ?? '';
  const names =
    BATCH_FILE.test(command) || /\.exe$/i.test(command)
      ? [command]
      : [`${command}.cmd`, `${command}.exe`, `${command}.bat`, command];
  for (const dir of pathEnv.split(';')) {
    if (!dir) {
      continue;
    }
    for (const fileName of names) {
      const candidate = path.win32.join(dir, fileName);
      try {
        if (fs.statSync(candidate).isFile()) {
          return candidate;
        }
      } catch {
        // Not there.
      }
    }
  }
  return command;
}

/**
 * Absolute path of `taskkill.exe`.
 *
 * A stubbed `PATH` (e2e fixtures plant only their own bins) would otherwise make `taskkill` ENOENT,
 * and the process the command needed to stop would keep running.
 */
export function windowsTaskkillCommand(): string {
  return path.win32.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'taskkill.exe');
}

/**
 * Characters `cmd.exe` reads as syntax rather than as text.
 *
 * The space and the comma are in the list because escaping them is what keeps an unquoted token in
 * one piece, and `"` is in it because a quote left bare would toggle quoting — see
 * {@link escapeArgumentForCmd}.
 */
const CMD_META_CHARS = /([()[\]%!^"`<>&|;, *?])/g;

/**
 * Quote the program of a `cmd.exe` command line.
 *
 * Only the quotes, because Windows forbids `"` in a path, so there is nothing here for
 * {@link escapeArgumentForCmd}'s first stage to encode. What the quotes buy is a path with spaces
 * (`C:\Users\Ada Lovelace\app`) staying one token.
 */
function quotePathForCmd(value: string): string {
  // A bare name is found on PATH. Quoting it makes cmd.exe look for a file of that name in cwd,
  // which is how `"npx.cmd"` became "not recognized" on the Windows runner.
  if (!/[\\/]/.test(value)) {
    return value;
  }
  return `"${value}"`;
}

/**
 * Escape one argument of a `cmd.exe` command line, for both readers of it.
 *
 * Two programs read this token in turn, and they do not agree on escaping, which is the whole
 * difficulty. `cmd.exe` has **no backslash escape**: it toggles quoting on every `"` and escapes
 * with `^`. The program `cmd.exe` then starts has no `^` escape: its runtime unescapes `\"` to a
 * quote and reads a doubled backslash run as one. A `\"` was therefore read by `cmd.exe` as the
 * *end* of the quoted run, which let a `&` in an argument start a second command — the value in a
 * project's `app.json` is not this CLI's, so that was reachable (CVE-2024-27980 is the same shape).
 *
 * So the token is built for the second reader and then hidden from the first. Stage one applies the
 * runtime's own rules, so the program recovers the value byte for byte. Stage two `^`-escapes every
 * character `cmd.exe` treats as syntax, **including the quotes stage one added**, so `cmd.exe` sees
 * one run of literal text with no syntax in it at all. Nothing is left inside a quoted run, which
 * is what makes the token safe rather than merely quoted.
 *
 * @see https://qntm.org/cmd for the runtime's rules, which `cross-spawn` encodes the same way.
 */
function escapeArgumentForCmd(value: string): string {
  const forProgram = value
    // A backslash run before a quote is doubled, and the quote it guards is escaped.
    .replace(/(\\*)"/g, '$1$1\\"')
    // A trailing backslash run is doubled, so the closing quote below is not the one it escapes.
    .replace(/(\\*)$/, '$1$1');

  return `"${forProgram}"`.replace(CMD_META_CHARS, '^$1');
}

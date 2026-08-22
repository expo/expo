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
  if (process.platform !== 'win32' || !BATCH_FILE.test(command)) {
    return { command, args, shell: false };
  }

  return {
    command: quoteForCmd(command),
    args: args.map(quoteForCmd),
    shell: true,
  };
}

/**
 * Quote one part of a `cmd.exe` command line.
 *
 * Quotes are what keeps a path with spaces (`C:\Users\Ada Lovelace\app`) one argument, and what
 * keeps `&`, `^` and `|` in a forwarded argument from being read as syntax — `exagent install`
 * passes on whatever the caller typed.
 */
function quoteForCmd(value: string): string {
  return `"${value.replace(/"/g, '\\"')}"`;
}

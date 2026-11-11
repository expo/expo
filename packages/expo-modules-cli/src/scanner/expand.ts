import { spawn } from 'child_process';
import fs from 'fs';

import { loadMacros } from './resolveMacros';

/** The options of the `expand` subcommand of the Expo Modules binary. */
export type ExpandArgs = {
  paths: string[];
  symbols?: string[];
  json?: boolean;
  diagnosticsOnly?: boolean;
};

/** The arguments for `expand`, with the paths last, because the binary has no `--` separator. */
export function buildExpandArgs({
  paths,
  symbols = [],
  json,
  diagnosticsOnly,
}: ExpandArgs): string[] {
  const args = ['expand'];
  for (const symbol of symbols) {
    args.push('--symbol', symbol);
  }
  if (json) {
    args.push('--json');
  }
  if (diagnosticsOnly) {
    args.push('--diagnostics-only');
  }
  return [...args, ...paths];
}

/**
 * The Expo Modules executable of the `expo-modules-macros` version that the module at `packageDir`
 * compiles with. That version must have `expand`, which `expo-modules-macros` 0.27.0 added.
 */
export function resolveExpandBinary(packageDir: string): string {
  const { macros, root, version } = loadMacros(packageDir);
  if (macros.SUPPORTED_EXPAND_SCHEMA_VERSION === undefined) {
    throw new Error(
      `expo-modules-macros ${version} at ${root} can't expand macros: \`expand\` needs ` +
        `expo-modules-macros 0.27.0 or later. Update "expo" in ${packageDir} to a version whose ` +
        `expo-modules-core depends on it, or pass the path to a newer executable with --scanner.`
    );
  }
  return macros.getScannerBinaryPath();
}

/**
 * Runs `expand` with the Expo Modules executable at `binaryPath`. Its output goes to this
 * process's stdout and stderr as it is, and the promise resolves with its exit code: `0`, `1` for an
 * error diagnostic (as text), or `2` for a usage error.
 */
export function runExpand(binaryPath: string, args: string[]): Promise<number> {
  if (!fs.existsSync(binaryPath)) {
    return Promise.reject(
      new Error(
        `The Expo Modules executable was not found at ${binaryPath}. It ships with ` +
          `expo-modules-macros, a dependency of expo-modules-core, so reinstall your JavaScript ` +
          `dependencies, or pass the path to a locally built executable with --scanner.`
      )
    );
  }
  return new Promise((resolve, reject) => {
    // An executable without the CLI would start the compiler plugin server and wait on stdin.
    const child = spawn(binaryPath, args, { stdio: ['ignore', 'inherit', 'inherit'] });
    child.on('error', (error) => {
      reject(
        new Error(
          `The Expo Modules executable at ${binaryPath} could not run: ${error.message}. Make sure ` +
            `the file is executable and built for this platform, or pass the path to another ` +
            `executable with --scanner.`,
          { cause: error }
        )
      );
    });
    child.on('close', (code, signal) => {
      resolve(code ?? (signal ? 1 : 0));
    });
  });
}

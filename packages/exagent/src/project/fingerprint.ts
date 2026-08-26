// @ref llp/0004-smart-start-and-project-state.rfc.md
// @ref llp/0011-impact-and-freshness.rfc.md §The fingerprint CLI is the substrate
// The `@expo/fingerprint` CLI as a subprocess (llp/0001 §Constraints item 5): the hash must come
// from the fingerprint version the project itself uses, or it cannot be compared with the hash of
// a previous build.
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { fileExistsSync } from '../utils/dir';
import { resolveSpawnTarget } from '../utils/windowsShim';
import { debugEvent } from './events';

/**
 * One source the fingerprint was computed from, as `@expo/fingerprint` prints it.
 *
 * Read across a process boundary, so nothing is required: this is another tool's payload and a
 * field that moved must degrade to `undefined` rather than throw. `reasons` is the one field
 * `impact` classifies on, and a source that arrived without it classifies as unknown.
 */
export interface FingerprintSource {
  type?: string;
  filePath?: string;
  id?: string;
  name?: string;
  version?: string;
  hash?: string | null;
  reasons?: string[];
  [key: string]: unknown;
}

/** Result of one fingerprint run. Mirrors `ProjectState['fingerprint']`. */
export interface FingerprintResult {
  hash: string | null;
  /**
   * The sources the hash was computed from, or `null` when the run failed.
   *
   * This is what makes a *diff* possible. A hash answers "did the native surface change"; only
   * the sources answer "what changed", which is the whole of what `impact` reports.
   */
  sources: FingerprintSource[] | null;
  error?: string;
}

/** Bin name `@expo/fingerprint` installs, per its `package.json` `bin` field. */
const BIN_NAME = 'fingerprint';

/** Command of the fingerprint CLI installed in the project. */
export function resolveFingerprintCli(projectRoot: string): string | null {
  const binName = process.platform === 'win32' ? `${BIN_NAME}.cmd` : BIN_NAME;
  const localBin = path.join(projectRoot, 'node_modules', '.bin', binName);
  // No `npx` fallback: `npx @expo/fingerprint` would download an arbitrary version, and a hash
  // from another version is not comparable with the project's own hashes.
  return fileExistsSync(localBin) ? localBin : null;
}

/** The sentence every caller reports when the project has no fingerprint CLI. */
export const FINGERPRINT_CLI_MISSING = `The @expo/fingerprint CLI is not installed in this project, so the native surface cannot be hashed. Install it with "npx expo install @expo/fingerprint".`;

export interface GenerateFingerprintOptions {
  /**
   * Hash only this platform's native surface.
   *
   * Omitted, the CLI hashes both, which is the right answer for a freshness *hash* and the wrong
   * one for a per-platform report: a change to `ios/` would move the android answer too.
   */
  platform?: 'ios' | 'android';
  /**
   * The preset the hash is computed under, passed through verbatim.
   *
   * Load-bearing for a comparison: `strict`, `balanced` and `relaxed` change what counts as a
   * source, so two fingerprints taken under different presets cannot be diffed meaningfully.
   * The caller is responsible for using one preset on both sides and reporting which.
   */
  preset?: string;
}

/**
 * Hash the native surface of a project with its own `@expo/fingerprint` CLI.
 *
 * Never throws and never rejects: a missing or failing fingerprint CLI is a probe result, not an
 * error, because the rest of the project state is still usable without a hash.
 */
export async function generateFingerprintAsync(
  projectRoot: string,
  options: GenerateFingerprintOptions = {}
): Promise<FingerprintResult> {
  const command = resolveFingerprintCli(projectRoot);
  if (!command) {
    return { hash: null, sources: null, error: FINGERPRINT_CLI_MISSING };
  }

  const result = await runFingerprintAsync(
    command,
    projectRoot,
    buildGenerateArgs(projectRoot, options)
  );
  if (result.error) {
    debugEvent('fingerprint_failed', { command, error: result.error });
  }
  return result;
}

/**
 * The argv of one `fingerprint:generate`.
 *
 * Exported for the unit test that pins it: this argv is the comparison's definition — the platform
 * and the preset decide what the hash means, and a base and a head computed with different ones
 * would produce a diff of the settings rather than of the project.
 */
export function buildGenerateArgs(
  projectRoot: string,
  { platform, preset }: GenerateFingerprintOptions = {}
): string[] {
  // `fingerprint:generate <projectRoot>` prints the fingerprint as one JSON object on stdout.
  const args = ['fingerprint:generate', projectRoot];
  if (platform) {
    args.push('--platform', platform);
  }
  if (preset) {
    args.push('--preset', preset);
  }
  return args;
}

/**
 * Diff two fingerprints with the project's own CLI.
 *
 * `fingerprint:diff` takes two **files**, not two revisions and not stdin [observed —
 * `@expo/fingerprint` `cli/src/commands/diffFingerprints.ts`], so both sides are written to a
 * temporary directory that is removed whatever happens. The upstream ask that would retire the
 * temp files is recorded in llp/0010 §Upstream asks.
 *
 * Never throws: a diff that could not be produced is reported as an error string, the same way a
 * failed generate is.
 */
export async function diffFingerprintsAsync(
  projectRoot: string,
  base: { hash: string; sources: FingerprintSource[] },
  head: { hash: string; sources: FingerprintSource[] }
): Promise<{ items: FingerprintDiffItem[] | null; error?: string }> {
  const command = resolveFingerprintCli(projectRoot);
  if (!command) {
    return { items: null, error: FINGERPRINT_CLI_MISSING };
  }

  let directory: string | null = null;
  try {
    // `mkdir` first: the system temporary directory always exists on a real machine, and does not
    // in the in-memory filesystem the unit tests run on.
    await fs.promises.mkdir(os.tmpdir(), { recursive: true });
    directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'exagent-fingerprint-'));
    const basePath = path.join(directory, 'base.json');
    const headPath = path.join(directory, 'head.json');
    await Promise.all([
      fs.promises.writeFile(basePath, JSON.stringify(base)),
      fs.promises.writeFile(headPath, JSON.stringify(head)),
    ]);

    const result = await runRawFingerprintAsync(command, projectRoot, [
      'fingerprint:diff',
      basePath,
      headPath,
    ]);
    if (result.error) {
      return { items: null, error: result.error };
    }

    const items = parseDiffItems(result.stdout);
    if (items == null) {
      return {
        items: null,
        error: `The fingerprint CLI returned a diff this command could not read: ${truncate(result.stdout.trim())}`,
      };
    }
    return { items };
  } catch (error) {
    return {
      items: null,
      error: `Could not diff the two fingerprints: ${(error as Error).message}`,
    };
  } finally {
    if (directory) {
      await fs.promises.rm(directory, { recursive: true, force: true }).catch(() => {});
    }
  }
}

/** One entry of a `fingerprint:diff`, as the CLI prints it. */
export type FingerprintDiffItem =
  | { op: 'added'; addedSource: FingerprintSource }
  | { op: 'removed'; removedSource: FingerprintSource }
  | { op: 'changed'; beforeSource: FingerprintSource; afterSource: FingerprintSource };

/**
 * The source a diff item is *about*, whichever operation it is.
 *
 * `changed` carries two, and the classifier reads the *after* side: the reasons of a source that
 * is still there are what it is there for now.
 */
export function diffItemSource(item: FingerprintDiffItem): FingerprintSource {
  switch (item.op) {
    case 'added':
      return item.addedSource;
    case 'removed':
      return item.removedSource;
    case 'changed':
      return item.afterSource;
  }
}

function runFingerprintAsync(
  command: string,
  projectRoot: string,
  args: string[]
): Promise<FingerprintResult> {
  return runRawFingerprintAsync(command, projectRoot, args).then((result) => {
    if (result.error) {
      return { hash: null, sources: null, error: result.error };
    }
    const fingerprint = parseFingerprint(result.stdout);
    if (fingerprint == null) {
      return {
        hash: null,
        sources: null,
        error: `The fingerprint CLI returned output without a hash: ${truncate(result.stdout.trim())}`,
      };
    }
    return fingerprint;
  });
}

/** Run the CLI and hand back its stdout, or the sentence that says why there is none. */
function runRawFingerprintAsync(
  command: string,
  projectRoot: string,
  args: string[]
): Promise<{ stdout: string; error?: string }> {
  return new Promise((resolve) => {
    // On Windows the project's bin is a batch shim, which only `cmd.exe` can run.
    const target = resolveSpawnTarget(command, args);
    const child = spawn(target.command, target.args, {
      cwd: projectRoot,
      // The output is data, not something the user should read, so stdout is captured. Debug
      // logs of the CLI go to stderr and are only reported when the command fails.
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: target.shell,
    });

    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error: NodeJS.ErrnoException) => {
      resolve({
        stdout,
        error: `Could not run the fingerprint CLI (${command}): ${error.message}`,
      });
    });

    child.on('close', (code, signal) => {
      if (code !== 0) {
        const reason = stderr.trim() || `exited with ${signal ?? code}`;
        resolve({ stdout, error: `The fingerprint CLI failed: ${reason}` });
        return;
      }
      resolve({ stdout });
    });
  });
}

/**
 * Read the fingerprint from the CLI output. The last JSON line wins, so a warning printed before
 * the result does not break the parse.
 */
export function parseFingerprint(output: string): FingerprintResult | null {
  const lines = output.split('\n').reverse();
  for (const line of lines) {
    if (!line.trim().startsWith('{')) {
      continue;
    }
    try {
      const parsed = JSON.parse(line) as { hash?: unknown; sources?: unknown };
      if (typeof parsed.hash === 'string' && parsed.hash) {
        return {
          hash: parsed.hash,
          // A payload with a hash and no `sources` array is still a usable freshness answer, so
          // the sources degrade to `null` rather than failing the parse.
          sources: Array.isArray(parsed.sources) ? (parsed.sources as FingerprintSource[]) : null,
        };
      }
    } catch {
      // Not the result line, keep looking.
    }
  }
  return null;
}

/**
 * Read the diff array out of the CLI output.
 *
 * `fingerprint:diff` pretty-prints, so the array spans many lines and the reverse-line scan that
 * reads a generate does not apply. The first `[` starts it and the output ends with it.
 */
export function parseDiffItems(output: string): FingerprintDiffItem[] | null {
  const start = output.indexOf('[');
  if (start < 0) {
    return null;
  }
  try {
    const parsed = JSON.parse(output.slice(start));
    return Array.isArray(parsed) ? (parsed as FingerprintDiffItem[]) : null;
  } catch {
    return null;
  }
}

function truncate(value: string, length = 200): string {
  return value.length > length ? `${value.slice(0, length)}…` : value;
}

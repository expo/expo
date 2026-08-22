// @ref llp/0004-smart-start-and-project-state.rfc.md
// The `@expo/fingerprint` CLI as a subprocess (llp/0001 §Constraints item 5): the hash must come
// from the fingerprint version the project itself uses, or it cannot be compared with the hash of
// a previous build.
import { spawn } from 'child_process';
import path from 'path';

import { fileExistsSync } from '../utils/dir';
import { debugEvent } from './events';

/** Result of one fingerprint run. Mirrors `ProjectState['fingerprint']`. */
export interface FingerprintResult {
  hash: string | null;
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

/**
 * Hash the native surface of a project with its own `@expo/fingerprint` CLI.
 *
 * Never throws and never rejects: a missing or failing fingerprint CLI is a probe result, not an
 * error, because the rest of the project state is still usable without a hash.
 */
export async function generateFingerprintAsync(projectRoot: string): Promise<FingerprintResult> {
  const command = resolveFingerprintCli(projectRoot);
  if (!command) {
    return {
      hash: null,
      error: `The @expo/fingerprint CLI is not installed in this project, so the native surface cannot be hashed. Install it with "npx expo install @expo/fingerprint".`,
    };
  }

  const result = await runFingerprintAsync(command, projectRoot);
  if (result.error) {
    debugEvent('fingerprint_failed', { command, error: result.error });
  }
  return result;
}

function runFingerprintAsync(command: string, projectRoot: string): Promise<FingerprintResult> {
  // `fingerprint:generate <projectRoot>` prints the fingerprint as one JSON object on stdout.
  const args = ['fingerprint:generate', projectRoot];

  return new Promise<FingerprintResult>((resolve) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      // The output is data, not something the user should read, so stdout is captured. Debug
      // logs of the CLI go to stderr and are only reported when the command fails.
      stdio: ['ignore', 'pipe', 'pipe'],
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
        hash: null,
        error: `Could not run the fingerprint CLI (${command}): ${error.message}`,
      });
    });

    child.on('close', (code, signal) => {
      if (code !== 0) {
        const reason = stderr.trim() || `exited with ${signal ?? code}`;
        resolve({ hash: null, error: `The fingerprint CLI failed: ${reason}` });
        return;
      }

      const hash = parseFingerprintHash(stdout);
      if (hash == null) {
        resolve({
          hash: null,
          error: `The fingerprint CLI returned output without a hash: ${truncate(stdout.trim())}`,
        });
        return;
      }
      resolve({ hash });
    });
  });
}

/**
 * Read the hash from the CLI output. The last JSON line wins, so a warning printed before the
 * result does not break the parse.
 */
function parseFingerprintHash(output: string): string | null {
  const lines = output.split('\n').reverse();
  for (const line of lines) {
    if (!line.trim().startsWith('{')) {
      continue;
    }
    try {
      const parsed = JSON.parse(line) as { hash?: unknown };
      if (typeof parsed.hash === 'string' && parsed.hash) {
        return parsed.hash;
      }
    } catch {
      // Not the result line, keep looking.
    }
  }
  return null;
}

function truncate(value: string, length = 200): string {
  return value.length > length ? `${value.slice(0, length)}…` : value;
}

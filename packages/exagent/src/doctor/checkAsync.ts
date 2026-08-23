// @ref llp/0001-agentic-cli-on-expo-cli.rfc.md §Constraints, item 5 — `expo-doctor` is a member of
// the Expo CLI family and is driven as a subprocess.
//
// The split is: expo-doctor diagnoses, `exagent` normalizes. Nothing here re-implements a check.

import path from 'path';
import { stripVTControlCharacters } from 'util';

import { fileExistsSync } from '../utils/dir';
import { CommandError } from '../utils/errors';
import { spawnSubprocessAsync } from '../utils/subprocess';
import { parseDoctorOutput } from './parseDoctorOutput';
import type { DoctorReport } from './types';

/** The `expo-doctor` invocation to spawn. */
export interface ExpoDoctorCli {
  /** Executable to spawn. */
  command: string;
  /** Arguments naming the CLI, before the ones for the run. Empty for a resolved bin. */
  args: string[];
}

/**
 * `--verbose` is not optional here.
 *
 * Without it `expo-doctor` names only the checks that failed, so the report could say how many
 * passed but never which ones. With it every check is printed as it finishes, which is what turns
 * the parse from "the failures" into the whole list [observed —
 * `packages/expo-doctor/src/doctor.ts` gates the per-check lines on `showVerboseTestResults`].
 */
export const DOCTOR_ARGS = ['--verbose'];

/**
 * Resolve the `expo-doctor` CLI to run for a project.
 *
 * The project's own copy wins, so the checks match the SDK the project is on; the registry is the
 * fallback, because `expo-doctor` is normally used through `npx` and is not a dependency of most
 * projects. Mirrors `resolveExpoCli`.
 */
export function resolveExpoDoctorCli(projectRoot: string): ExpoDoctorCli {
  const binName = process.platform === 'win32' ? 'expo-doctor.cmd' : 'expo-doctor';
  const localBin = path.join(projectRoot, 'node_modules', '.bin', binName);
  if (fileExistsSync(localBin)) {
    return { command: localBin, args: [] };
  }
  // On Windows npm ships `npx` as a batch file, which `resolveSpawnTarget` starts through a shell.
  const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  return { command: npx, args: ['expo-doctor'] };
}

/**
 * Run `expo-doctor` and normalize what it printed.
 *
 * Never throws for a failing check: a check that fails is the answer, not an error. The one failure
 * this reports as a `CommandError` is not being able to start the tool at all.
 *
 * @throws {CommandError} `EXPO_DOCTOR_NOT_FOUND` when the CLI could not be spawned.
 */
export async function runDoctorCheckAsync(projectRoot: string): Promise<DoctorReport> {
  const cli = resolveExpoDoctorCli(projectRoot);
  // Captured, not inherited: this command owns its output, and under `--json` it owns stdout.
  const result = await spawnSubprocessAsync(cli.command, [...cli.args, ...DOCTOR_ARGS], {
    cwd: projectRoot,
    output: 'capture',
  });

  if (result.spawnError) {
    const error = new CommandError(
      'EXPO_DOCTOR_NOT_FOUND',
      [
        `Could not run expo-doctor (${cli.command}), so this project was never checked.`,
        `Why: spawning it failed (${result.spawnError.code ?? result.spawnError.message}). expo-doctor is not installed in this project and the npx fallback could not run either, which for npx means npm is not on PATH.`,
        `How: run "npx expo-doctor" once to fetch it, or add it to the project with "npm install --save-dev expo-doctor", then run this command again.`,
      ].join('\n')
    );
    error.suggestedCommand = 'npx expo-doctor';
    throw error;
  }

  // Both streams: the check detail is on stdout and the closing "N checks failed" line is on
  // stderr [observed — `Log.exit` uses `console.error` for a non-zero code].
  const raw = stripVTControlCharacters(`${result.stdout}${result.stderr}`);

  return {
    projectRoot,
    exitCode: result.exitCode,
    raw,
    ...parseDoctorOutput(raw),
  };
}

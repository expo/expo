// @ref llp/0001-agentic-cli-on-expo-cli.rfc.md §Constraints — `expo-doctor` is a member of
// the Expo CLI family and is driven as a subprocess.
//
// The split is: expo-doctor diagnoses, `@expo/agent-cli` normalizes. Nothing here re-implements a check.

import { stripVTControlCharacters } from 'util';

import { CommandError } from '../utils/errors';
import { resolvePackageRunner } from '../utils/packageRunner';
import { resolveProjectBin } from '../utils/projectBin';
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
 *
 * "The project's own copy" is the walk of `src/utils/projectBin.ts`, so a workspace package finds
 * the copy its install hoisted. Here the old literal path degraded quietly rather than failing —
 * the registry rung answered, with a download and a version of the checks the project did not
 * choose (F113, wave 28).
 */
export function resolveExpoDoctorCli(projectRoot: string): ExpoDoctorCli {
  const localBin = resolveProjectBin(projectRoot, 'expo-doctor');
  if (localBin) {
    return { command: localBin, args: [] };
  }
  // The runner the caller reached this CLI through, so a Bun project stays on Bun (`packageRunner`).
  // On Windows npm ships `npx` as a batch file, which `resolveSpawnTarget` starts through a shell.
  const { command } = resolvePackageRunner();
  return { command, args: ['expo-doctor'] };
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
    throw notFoundError(
      cli,
      `spawning it failed (${result.spawnError.code ?? result.spawnError.message})`
    );
  }

  // Both streams: the check detail is on stdout and the closing "N checks failed" line is on
  // stderr [observed — `Log.exit` uses `console.error` for a non-zero code].
  const raw = stripVTControlCharacters(`${result.stdout}${result.stderr}`);
  const parsed = parseDoctorOutput(raw);

  // 127 is the shell's "command not found", so the npx fallback resolved to nothing and expo-doctor
  // never ran. Mirroring it would hand the caller a code that looks like a verdict on the project;
  // it is a verdict on this machine, so it is a tool error with the install step attached. The
  // parse has to have found nothing too, in case a future expo-doctor ever exits 127 of its own.
  if (result.exitCode === 127 && parsed.parse === 'failed') {
    throw notFoundError(cli, `running it exited 127, which is "command not found"`);
  }

  return { projectRoot, exitCode: result.exitCode, raw, ...parsed };
}

/** The error for a machine where expo-doctor could not be run at all. */
function notFoundError(cli: ExpoDoctorCli, why: string): CommandError {
  const error = new CommandError(
    'EXPO_DOCTOR_NOT_FOUND',
    [
      `Could not run expo-doctor (${cli.command}), so this project was never checked.`,
      `Why: ${why}. expo-doctor is not installed in this project, and the npx fallback could not fetch or start it either.`,
      `How: add it to the project with "npm install --save-dev expo-doctor", or run "npx expo-doctor" once on a machine with network access to fetch it, then run this command again.`,
    ].join('\n')
  );
  error.suggestedCommand = 'npm install --save-dev expo-doctor';
  return error;
}

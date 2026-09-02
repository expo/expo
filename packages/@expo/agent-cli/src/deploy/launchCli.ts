// @ref llp/0007-deploy-and-headless.rfc.md §deploy — native delivery goes through
// launch.expo.dev.
// @ref llp/0001-agentic-cli-on-expo-cli.rfc.md §Constraints — the Expo CLI family is
// invoked as subprocesses, never imported or reimplemented.
//
// `create-launch` is that family: it already packs the project source, authenticates as the signed
// in user, uploads, and answers with the launch. So this module drives it and maps its failures
// onto the errors-are-prompts contract (llp/0006) — it does not repeat any of that work.
//
// The machine-readable half of its surface [observed — create-launch src/commands/launch.ts]:
// `--json` prints one `{ id, url, framework }` object on stdout, keeps human progress on stderr,
// answers its own confirmation, and fails before uploading anything when nobody is signed in.

import { needsHumanError } from '../needsHuman/error';
import { PROGRAM_PREFIX } from '../programName';
import { CommandError } from '../utils/errors';
import { resolvePackageRunner } from '../utils/packageRunner';
import { resolveProjectBin } from '../utils/projectBin';
import { findExecutableOnPath, spawnSubprocessAsync } from '../utils/subprocess';
import type { LaunchResult } from './types';

/** The `create-launch` invocation to spawn. */
export interface CreateLaunchCli {
  /** Executable to spawn. */
  command: string;
  /** Arguments that name the CLI, before the ones for the launch. Empty for a resolved bin. */
  args: string[];
}

/**
 * Resolve the `create-launch` CLI to run.
 *
 * The project's own copy wins, so a repository can pin the version that ships its app; then a
 * globally installed one; then the registry, which is how the tool is normally used and needs no
 * install step of its own.
 *
 * "The project's own copy" is the walk of `src/utils/projectBin.ts`: a workspace installs a
 * package's dependencies at its root, and a repository that pins a version pins it for the packages
 * inside it — so a hoisted copy has to beat the machine's own `PATH` entry (F113, wave 28).
 *
 * @param pathEnv `PATH` to search, for tests that must not depend on the machine's own.
 */
export function resolveCreateLaunchCli(
  projectRoot: string,
  { pathEnv }: { pathEnv?: string } = {}
): CreateLaunchCli {
  const projectBin = resolveProjectBin(projectRoot, 'create-launch');
  if (projectBin) {
    return { command: projectBin, args: [] };
  }

  const pathBin = findExecutableOnPath('create-launch', { pathEnv });
  if (pathBin) {
    return { command: pathBin, args: [] };
  }

  const { command } = resolvePackageRunner({ pathEnv });
  return { command, args: ['create-launch@latest'] };
}

/**
 * The `create-launch` arguments for one launch.
 *
 * `--json` is not optional here: it is what makes the run non-interactive (it answers the
 * confirmation itself) and what turns the result into something to parse instead of scrape.
 */
export function buildCreateLaunchArgs({ projectPath }: { projectPath?: string }): string[] {
  const args = ['--json'];
  if (projectPath) {
    // `--project` is relative to the directory the CLI runs in, i.e. the directory it uploads.
    args.push('--project', projectPath);
  }
  return args;
}

export interface RunCreateLaunchOptions {
  cli: CreateLaunchCli;
  /** Directory the CLI runs in, which is the directory it uploads. */
  uploadRoot: string;
  /** Path of the app inside that directory, for a monorepo. */
  projectPath?: string;
  /** This command owns stdout, so the progress of the CLI is captured instead of printed. */
  json: boolean;
}

/**
 * Create a launch by running `create-launch`.
 *
 * @throws {CommandError} `CREATE_LAUNCH_UNAVAILABLE` when the CLI could not be started,
 * `LAUNCH_NOT_AUTHENTICATED` when it refused for lack of a login (a `NeedsHumanError`, so the
 * process exits 7), `LAUNCH_FAILED` for anything else it reported, `LAUNCH_UNEXPECTED_OUTPUT` when
 * it succeeded without printing a launch.
 */
export async function runCreateLaunchAsync(options: RunCreateLaunchOptions): Promise<LaunchResult> {
  const args = [...options.cli.args, ...buildCreateLaunchArgs(options)];

  const result = await spawnSubprocessAsync(options.cli.command, args, {
    cwd: options.uploadRoot,
    // Its stdout is the payload either way. Its stderr is human progress, which belongs on the
    // terminal as it happens — unless nothing may be printed, and then it is kept for the error.
    output: options.json ? 'capture' : 'capture-stdout',
  });

  if (result.spawnError) {
    const error = new CommandError(
      'CREATE_LAUNCH_UNAVAILABLE',
      [
        `Could not run ${options.cli.command}, so the app could not be launched.`,
        `Why: spawning it failed (${result.spawnError.code ?? result.spawnError.message}), which for the npx fallback means npm is not on PATH.`,
        `How: install Node.js with npm, or install the launch CLI once with "npm install -g create-launch", then run this command again.`,
      ].join('\n')
    );
    error.suggestedCommand = 'npm install -g create-launch';
    throw error;
  }

  if (result.exitCode !== 0) {
    throw failureError(result, options.json);
  }

  const launch = parseLaunch(result.stdout);
  if (!launch) {
    const error = new CommandError(
      'LAUNCH_UNEXPECTED_OUTPUT',
      [
        `The launch CLI finished, but it did not print a launch, so there is no URL to hand over.`,
        `Why: "create-launch --json" prints one JSON object with the id, the URL and the framework, and this run printed something else${outputTail(result.stdout) ? `:\n${outputTail(result.stdout)}` : '.'}`,
        `How: check the installed version of create-launch, then run the command again. Running "npx create-launch@latest --json" directly shows the same output without this wrapper.`,
      ].join('\n')
    );
    error.suggestedCommand = 'npx create-launch@latest --json';
    throw error;
  }

  return launch;
}

/**
 * The launch the CLI printed.
 *
 * The last JSON line wins: anything the CLI writes to stdout before its payload (a debug line, a
 * notice) must not decide the result.
 */
function parseLaunch(stdout: string): LaunchResult | null {
  const lines = stdout.split('\n').reverse();
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('{')) {
      continue;
    }
    try {
      const data = JSON.parse(trimmed);
      if (data && typeof data.id === 'string' && typeof data.url === 'string') {
        return { id: data.id, url: data.url, framework: String(data.framework ?? 'unknown') };
      }
    } catch {
      // Not the payload line; keep looking.
    }
  }
  return null;
}

/**
 * Map a failed run onto an error that names the next action.
 *
 * The one thing scraped from the output is the missing-login case, because the CLI prints its error
 * code only under `EXPO_DEBUG` and a login is the one failure with an exact fix — and the fix
 * belongs to a person, so it becomes a handoff rather than an error. Everything else is passed
 * through as the CLI worded it: it knows why it stopped, and repeating its words beats guessing.
 * (An upstream `--json` error object would make this exact — llp/0006 §The process boundary: gaps
 * become upstream improvements.)
 */
function failureError(
  result: { exitCode: number | null; stdout: string; stderr: string },
  json: boolean
): CommandError {
  const said = outputTail(`${result.stderr}${result.stdout}`);

  if (/authenticat/i.test(said)) {
    // Nothing about the call was wrong and a retry will stop here again, so this is the
    // needs-human band (llp/0010 §Needs-human protocol) rather than a tool error. The code is the
    // one this site has always raised: reclassifying a failure must not rename it.
    return needsHumanError('expo-login', {
      code: 'LAUNCH_NOT_AUTHENTICATED',
      detectedBy: 'exit-signature',
      message: [
        `Launch needs an Expo account, and this machine is not signed in to one.`,
        `Why: the launch runs as you — the upload, the store account and the signing all belong to your Expo account — and the launch CLI found no session and no EXPO_TOKEN.`,
        `How: run "npx expo login" once on this machine, or set EXPO_TOKEN to a personal access token from https://expo.dev/settings/access-tokens for a machine that cannot sign in interactively.`,
      ].join('\n'),
    });
  }

  const error = new CommandError(
    'LAUNCH_FAILED',
    [
      `The launch was not created (create-launch exited with code ${result.exitCode}).`,
      `Why: ${said || 'the launch CLI stopped without a message; its own output above says what it was doing.'}`,
      // In text mode its output already went to the terminal as it happened.
      json || !said
        ? `How: fix what it reported and run the command again. Nothing is submitted until the launch URL is opened, so a retry is safe.`
        : `How: fix what it reported above and run the command again. Nothing is submitted until the launch URL is opened, so a retry is safe.`,
    ].join('\n')
  );
  error.suggestedCommand = `${PROGRAM_PREFIX} deploy --native`;
  return error;
}

/** The last lines of a captured stream, which is where a CLI says what went wrong. */
function outputTail(output: string, maxLines = 10): string {
  return output
    .split('\n')
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .slice(-maxLines)
    .join('\n');
}

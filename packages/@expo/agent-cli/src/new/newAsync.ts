// @ref llp/0007-deploy-and-headless.rfc.md §new
// One project, created from flags alone: `create-expo` as a subprocess, then the steps it does not
// do (the display name, a repository when there is none), then the report and the next actions.
import chalk from 'chalk';
import path from 'path';

import { followUpsEnabled, reportFollowUps } from '../followups';
import { buildNewFollowUps } from '../followups/new';
import type { FollowUp } from '../followups/types';
import * as Log from '../log';
import { directoryExistsSync } from '../utils/dir';
import { CommandError } from '../utils/errors';
import { isInteractive } from '../utils/interactive';
import { spawnSubprocessAsync, type SubprocessOptions } from '../utils/subprocess';
import { applyAppNameAsync } from './appName';
import { buildCreateExpoArgs, resolveCreateExpoCli } from './createExpo';
import { debugEvent, event } from './events';
import { resolveGitStateAsync } from './git';
import { createExpoOutputFilter } from './output';
import type { NewOptions } from './resolveOptions';

/** Width of the label column of the human readable summary, as in `@expo/agent-cli status`. */
const LABEL_WIDTH = 12;

/** How much of a failed `create-expo` run is repeated on stderr in `--json` mode. */
const FAILURE_TAIL_LINES = 20;

/** The shape `@expo/agent-cli new --json` prints. Top-level keys are the stable contract (llp/0006). */
export interface NewProjectReport {
  /** Absolute path of the project directory, whether or not it was created. */
  projectRoot: string;
  /** Display name written into `app.json`, or null when `--name` was not used or not applicable. */
  name: string | null;
  /** `create-expo` finished successfully. */
  created: boolean;
  /** Dependencies were installed, i.e. `--no-install` was not passed. */
  installed: boolean;
  /** The project is its own git repository. */
  gitInitialized: boolean;
  followups: FollowUp[];
}

/**
 * Create a new Expo project without a terminal.
 *
 * @returns the exit code to end the command with: `create-expo`'s own, so a failed scaffold fails
 * the caller with the code the tool reported.
 */
export async function createNewProjectAsync(cwd: string, options: NewOptions): Promise<number> {
  const projectRoot = path.resolve(cwd, options.directory);
  // Read before anything is spawned, because afterwards it cannot be told: this is what makes
  // `--no-git` safe to act on (`./git.ts` §removeCreateExpoRepositoryAsync). A `.git` inside a
  // directory this command created is create-expo's own; one inside a directory that was already
  // here may be somebody's history.
  const createdProjectDirectory = !directoryExistsSync(projectRoot);
  const cli = resolveCreateExpoCli();
  const args = [...cli.args, ...buildCreateExpoArgs(options.directory, options)];
  debugEvent('create_expo', { command: cli.command, args });

  const result = await spawnSubprocessAsync(cli.command, args, {
    cwd,
    // Three cases, not two. `--json` owns stdout, so the scaffold output is captured and printed
    // nowhere. A person at a terminal gets the tool's own stdio, spinner and all — it was written
    // for exactly that. Anything else — an agent, a log file, CI — gets the output filtered,
    // because a spinner with no cursor to move lands as one line of frames and the tool's closing
    // next-steps block arrives directly above this command's own (`./output.ts`).
    ...spawnOutputFor(options),
  });

  if (result.spawnError) {
    const error = new CommandError(
      'CREATE_EXPO_UNAVAILABLE',
      [
        `Could not run ${cli.command}, so no project could be created.`,
        `Why: spawning it failed (${result.spawnError.code ?? result.spawnError.message}), which for the npx fallback means npm is not on PATH.`,
        `How: install Node.js with npm, or install the scaffolding tool once with "npm install -g create-expo", then run this command again.`,
      ].join('\n')
    );
    error.suggestedCommand = 'npm install -g create-expo';
    throw error;
  }

  if (result.exitCode !== 0) {
    return reportFailure(projectRoot, options, result);
  }

  const name =
    options.name && (await applyAppNameAsync(projectRoot, options.name)) ? options.name : null;
  if (options.name && !name) {
    Log.warn(
      `The app was created, but its name was left as it is: --name writes to app.json, and this template does not have one.`
    );
  }

  const git = await resolveGitStateAsync(projectRoot, { ...options, createdProjectDirectory });
  event('created', {
    projectRoot,
    name,
    installed: options.install,
    gitInitialized: git.initialized,
  });

  const followups = followUpsEnabled(options.followups)
    ? buildNewFollowUps({ directory: options.directory, installed: options.install })
    : [];

  const report: NewProjectReport = {
    projectRoot,
    name,
    created: true,
    installed: options.install,
    gitInitialized: git.initialized,
    followups,
  };

  if (options.json) {
    Log.log(JSON.stringify(report, null, 2));
  } else {
    for (const line of summaryLines(report, git.detail)) {
      Log.log(line);
    }
  }

  reportFollowUps('new', followups, { json: options.json });
  return 0;
}

/** How the `create-expo` subprocess is wired, per the three cases above. */
function spawnOutputFor(options: NewOptions): Pick<SubprocessOptions, 'output' | 'printFilter'> {
  if (options.json) {
    return { output: 'capture' };
  }
  return isInteractive()
    ? { output: 'inherit' }
    : { output: 'tee', printFilter: createExpoOutputFilter() };
}

/**
 * Report a scaffold that failed, and hand its exit code back.
 *
 * `--json` still prints exactly one object, because a caller that parses stdout has to be able to
 * parse a failure too; the captured output goes to stderr, where nothing is parsing.
 */
function reportFailure(
  projectRoot: string,
  options: NewOptions,
  result: { exitCode: number | null; stdout: string; stderr: string }
): number {
  const exitCode = result.exitCode ?? 1;

  if (options.json) {
    const captured = tail(`${result.stdout}${result.stderr}`, FAILURE_TAIL_LINES);
    if (captured) {
      Log.error(captured);
    }
    const report: NewProjectReport = {
      projectRoot,
      name: null,
      created: false,
      installed: false,
      gitInitialized: false,
      followups: [],
    };
    Log.log(JSON.stringify(report, null, 2));
    return exitCode;
  }

  Log.error(
    [
      `Creating the project at ${projectRoot} failed: create-expo exited with code ${exitCode}.`,
      `Why: the scaffolding step could not finish; its own output above says what stopped it.`,
      `How: fix what it reported — a directory that already has files, no network access, or an unsupported Node.js version — then run this command again.`,
    ].join('\n')
  );
  return exitCode;
}

function summaryLines(report: NewProjectReport, gitDetail: string): string[] {
  const lines: string[] = [];
  const row = (label: string, value: string) =>
    lines.push(`${chalk.dim(label.padEnd(LABEL_WIDTH))}${value}`);

  row('Project', report.projectRoot);
  if (report.name) {
    row('Name', report.name);
  }
  row('Install', report.installed ? 'done' : 'skipped (--no-install)');
  row('Git', gitDetail);

  return lines;
}

/** The last non-empty lines of a captured run, which is where a tool says what went wrong. */
function tail(output: string, maxLines: number): string {
  return output
    .split('\n')
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .slice(-maxLines)
    .join('\n');
}

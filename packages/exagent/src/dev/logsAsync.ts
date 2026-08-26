// @ref llp/0005-runtime-loop-tools.rfc.md §Reading the detached dev server's output
// @ref llp/0010-agent-conventions.rfc.md §Exit codes
// `exagent dev:logs`: what this project's detached dev server has printed.
//
// The counterpart of `dev --detach`. Detaching moves the bundler's output off the terminal, and
// this is where it goes instead — so the answer to "why is the app not loading" is still one
// command away rather than a path the caller has to know.
//
// **No `--follow`.** A tail that never returns is the very thing `--detach` exists to avoid: it
// would hold the shell open again, and a driving agent cannot read a stream that has no end. An
// agent polls this command instead, which is also what makes each read a bounded, quotable answer.
//
// The output is fenced as untrusted, like every other command that prints what a running project
// produced: a bundler's log carries file contents and error messages from code this CLI did not
// write (llp/0008 §Untrusted content).

import chalk from 'chalk';

import { readDevServerLockAsync } from '../devLock';
import { event as cliEvent } from '../events';
import { followUpsEnabled, reportFollowUps, type FollowUp } from '../followups';
import * as Log from '../log';
import { wrapUntrustedAppOutput } from '../runtime/untrusted';
import { CommandError } from '../utils/errors';
import { detachedLogPath, readDetachedLogSync } from './logFile';
import type { DevLogsOptions } from './resolveLogsOptions';

/**
 * Machine shape of `exagent dev:logs --json`.
 *
 * @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract
 */
export interface DevLogsResultJson {
  /** The file that was read. */
  logFile: string;
  /** The lines themselves, ANSI stripped, oldest first. */
  lines: string[];
  /** How many lines the file has, so a caller knows whether it is looking at all of them. */
  totalLines: number;
  /** Whether older lines were left out. */
  truncated: boolean;
  /** The dev server this log belongs to, when one is running, or null. */
  devServer: { url: string; port: number; pid: number } | null;
  followups: FollowUp[];
}

/**
 * Print what this project's detached dev server has written.
 *
 * @returns `0`. A log that exists is the answer, whatever is in it.
 * @throws {CommandError} `NO_DEV_LOG` when this project has no detached dev server log.
 */
export async function devLogsAsync(projectRoot: string, options: DevLogsOptions): Promise<number> {
  const read = readDetachedLogSync(projectRoot, options.tail);
  const lock = await readDevServerLockAsync(projectRoot);

  if (!read) {
    throw noLogError(projectRoot, lock != null);
  }

  const report: DevLogsResultJson = {
    logFile: read.logFile,
    lines: read.lines,
    totalLines: read.totalLines,
    truncated: read.truncated,
    devServer: lock ? { url: lock.url, port: lock.port, pid: lock.pid } : null,
    followups: [],
  };
  report.followups = followUpsEnabled(options.followups) ? buildFollowUps(report) : [];

  cliEvent('dev_logs', {
    logFile: report.logFile,
    lines: report.lines.length,
    totalLines: report.totalLines,
  });

  if (options.json) {
    Log.log(JSON.stringify(report, null, 2));
  } else {
    printHumanReport(report);
  }
  reportFollowUps('dev:logs', report.followups, { json: options.json });
  return 0;
}

function printHumanReport(report: DevLogsResultJson): void {
  const label = (name: string) => chalk.dim(name.padEnd(13));
  const header = [
    `${label('Log')}${report.logFile}`,
    `${label('Lines')}${report.lines.length} of ${report.totalLines}${
      report.truncated ? chalk.dim(' · older lines not shown') : ''
    }`,
  ];
  if (report.devServer) {
    header.push(
      `${label('Dev server')}${report.devServer.url}${chalk.dim(` · pid ${report.devServer.pid}`)}`
    );
  } else {
    header.push(
      `${label('Dev server')}${chalk.dim('not running · this is what the last detached run printed')}`
    );
  }
  Log.log(header.join('\n'));
  Log.log('');
  Log.log(wrapUntrustedAppOutput(report.lines.join('\n')));
}

/** @ref llp/0009-smart-followups.rfc.md §Examples per command */
function buildFollowUps(report: DevLogsResultJson): FollowUp[] {
  if (!report.devServer) {
    return [
      {
        id: 'dev-detach',
        command: 'npx exagent dev --detach --wait-ready',
        why: 'These lines are from a dev server that is no longer running, so nothing is serving this project now.',
      },
    ];
  }
  return [
    {
      id: 'dev-wait',
      command: 'npx exagent dev:wait',
      why: 'The log says what the bundler printed; this says whether it finished and whether this project still compiles.',
    },
  ];
}

/**
 * The error for a project with no detached dev server log.
 *
 * Two different situations, and the difference is the whole value of the message: a project with a
 * *running* dev server and no log has one that was started in a terminal, and its output is on that
 * terminal — there is nothing this command could have printed, and saying "no log" without saying
 * why would send the caller looking for a file that was never going to exist.
 */
function noLogError(projectRoot: string, serverRunning: boolean): CommandError {
  const logFile = detachedLogPath(projectRoot);
  const error = new CommandError(
    'NO_DEV_LOG',
    serverRunning
      ? [
          `This project has a dev server running, but no log to read: it was started attached.`,
          `Why: only "npx exagent dev --detach" writes to ${logFile}. A dev server started in a terminal writes to that terminal, and nothing captured it — so its output is there and nowhere else.`,
          `How: read it in the terminal it is running in. To get a log next time, stop it with "npx exagent dev:stop" and start it again with "npx exagent dev --detach". For what the bundler is doing right now, "npx exagent dev:wait" answers without a log.`,
        ].join('\n')
      : [
          `This project has no detached dev server log, so there is nothing to read.`,
          `Why: nothing has been written to ${logFile}, which means no "npx exagent dev --detach" has run in this project.`,
          `How: start one with "npx exagent dev --detach --wait-ready", then run this command again.`,
        ].join('\n')
  );
  error.suggestedCommand = serverRunning
    ? 'npx exagent dev:wait'
    : 'npx exagent dev --detach --wait-ready';
  return error;
}

// @ref llp/0004-smart-start-and-project-state.rfc.md §Daemonization
// @ref llp/0010-agent-conventions.rfc.md §Exit codes
// `@expo/agent-cli dev:logs`: what this project's detached dev server has printed.
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
// write (llp/0008-guardrails.rfc.md §Untrusted-content marking).

import chalk from 'chalk';

import { readDevServerLockAsync } from '../devLock';
import { event as cliEvent } from '../events';
import { followUpsEnabled, reportFollowUps, type FollowUp } from '../followups';
import * as Log from '../log';
import { PROGRAM_PREFIX } from '../programName';
import { wrapUntrustedAppOutput } from '../runtime/untrusted';
import { CommandError } from '../utils/errors';
import {
  readDevServerLogSync,
  resolveDevServerReach,
  type DevServerHostType,
} from './advertisedUrl';
import { detachedLogPath, readDetachedLogSync } from './logFile';
import type { DevLogsOptions } from './resolveLogsOptions';

/**
 * Machine shape of `@expo/agent-cli dev:logs --json`.
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
  /**
   * The URL the dev server advertised in this log, and what kind of host it is.
   *
   * Null when the log never carried one. `tunnel` is the case worth reading: it is the address a
   * phone or a cloud simulator uses, and it appears nowhere in `devServer.url`.
   */
  advertised: { url: string; hostType: DevServerHostType } | null;
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

  // Read over the **whole** log rather than the tail this command was asked for: the `Waiting on`
  // line is near the top of a file whose tail is what a caller usually wants, so a `--tail 20`
  // would hide the one address a device off this machine can use.
  const reach = resolveDevServerReach(readDevServerLogSync(projectRoot), lock);

  const report: DevLogsResultJson = {
    logFile: read.logFile,
    lines: read.lines,
    totalLines: read.totalLines,
    truncated: read.truncated,
    devServer: lock ? { url: lock.url, port: lock.port, pid: lock.pid } : null,
    advertised: reach.advertised
      ? { url: reach.advertised.url, hostType: reach.advertised.hostType }
      : null,
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
  const reach = reachLine(report);
  if (reach) {
    header.push(`${label('Reach')}${reach}`);
  }
  Log.log(header.join('\n'));

  Log.log('');
  Log.log(wrapUntrustedAppOutput(report.lines.join('\n')));
}

/** Where a device off this machine reached this dev server, when the log said. */
function reachLine(report: DevLogsResultJson): string | null {
  if (report.advertised?.hostType === 'tunnel') {
    return `${chalk.green('tunnel')} ${report.advertised.url}`;
  }
  return report.advertised
    ? chalk.dim(`${report.advertised.hostType} · ${report.advertised.url}`)
    : null;
}

/** @ref llp/0009-smart-followups.rfc.md §Examples per command */
function buildFollowUps(report: DevLogsResultJson): FollowUp[] {
  if (!report.devServer) {
    return [
      {
        id: 'dev-detach',
        command: `${PROGRAM_PREFIX} dev --detach --wait-ready`,
        why: 'These lines are from a dev server that is no longer running, so nothing is serving this project now.',
      },
    ];
  }
  return [
    {
      id: 'smoke',
      command: `${PROGRAM_PREFIX} smoke`,
      why: 'The log says what the bundler printed; this says whether it finished, whether this project still compiles, and whether the app comes up on it.',
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
          `Why: only "${PROGRAM_PREFIX} dev --detach" writes to ${logFile}. A dev server started in a terminal writes to that terminal, and nothing captured it — so its output is there and nowhere else.`,
          `How: read it in the terminal it is running in. To get a log next time, stop it with "${PROGRAM_PREFIX} dev:stop" and start it again with "${PROGRAM_PREFIX} dev --detach". For what the bundler is doing right now, "${PROGRAM_PREFIX} smoke" answers without a log.`,
        ].join('\n')
      : [
          `This project has no detached dev server log, so there is nothing to read.`,
          `Why: nothing has been written to ${logFile}, which means no "${PROGRAM_PREFIX} dev --detach" has run in this project.`,
          `How: start one with "${PROGRAM_PREFIX} dev --detach --wait-ready", then run this command again.`,
        ].join('\n')
  );
  error.suggestedCommand = serverRunning
    ? `${PROGRAM_PREFIX} smoke`
    : `${PROGRAM_PREFIX} dev --detach --wait-ready`;
  return error;
}

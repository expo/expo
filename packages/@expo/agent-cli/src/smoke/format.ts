// @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract
// The two channels of `@expo/agent-cli smoke`: labelled lines for a terminal, and one JSON object whose
// keys mirror those labels. Pure over one `SmokeRun`, so both shapes are testable without a dev
// server, a device, or a clock.

import chalk from 'chalk';

import type { FollowUp } from '../followups';
import type { RouteCheckJson } from '../navigate/routeCheck';
import { bundleToJson } from '../runtime/bundleCheck';
import { wrapUntrustedAppOutput } from '../runtime/untrusted';
import { isFailingRecord, type SmokeRun } from './phases';
import type { SmokeOptions } from './resolveOptions';
import type { SmokePhase, SmokeResource, SmokeResultJson } from './types';

/** Width of the label column, matching `status` and `deploy`. */
const LABEL_WIDTH = 12;

/** Separates the facts inside one line. */
const SEPARATOR = ' · ';

/** The route check of a run that never reached one, so the key set never varies. */
function uncheckedRoute(reason: string): RouteCheckJson {
  return { checked: false, ok: null, matched: null, routeCount: 0, reason };
}

export function smokeResultToJson(
  run: SmokeRun,
  options: SmokeOptions,
  followups: FollowUp[]
): SmokeResultJson {
  const failing = run.errors.filter(isFailingRecord).length;
  return {
    ok: run.outcome === 'passed',
    outcome: run.outcome,
    phases: run.phases,
    devServerUrl: run.devServerUrl,
    source: run.discovery?.source ?? 'default',
    projectRootMatched: run.projectRootMatched,
    started: run.started,
    environment: run.environment,
    appsConnected: run.appsConnected,
    // The same object `dev:wait` and `runtime:reload` print, from the same function: one question
    // asked in three commands must not have three shapes (llp/0010 §Other gates, in brief).
    bundle: bundleToJson(run.bundle),
    route: run.route,
    routeCheck:
      run.routeCheck ??
      uncheckedRoute(
        run.route == null
          ? 'no --route was given, so no route was checked'
          : 'the run ended before the route was opened'
      ),
    platform: options.platform,
    deviceId: run.deviceId,
    deviceBackend: run.deviceBackend,
    runtimeSupported: run.runtimeSupported,
    reload: run.reload,
    appMismatch: run.appMismatch,
    errors: {
      windowMs: run.windowMs,
      // Null rather than 0 for a window that never opened: zero errors and no window are opposite
      // facts, and only one of them is evidence.
      count: run.windowMs == null ? null : run.errors.length,
      failing: run.windowMs == null ? null : failing,
      logs: run.windowMs == null ? null : run.errors.length - failing,
      records: run.errors,
    },
    screenshot: run.screenshot,
    durationMs: run.durationMs,
    // @ref llp/0008-guardrails.rfc.md — every string in here came out of the app.
    untrusted: ['errors.records'],
    followups,
  };
}

/** One label, one value, matching the other reports of this CLI. */
function row(label: string, value: string): string {
  return `${chalk.dim(label.padEnd(LABEL_WIDTH))}${value}`;
}

/** Render the run as one labelled line per fact, in the order they were established. */
export function formatSmokeResult(run: SmokeRun, options: SmokeOptions): string {
  const lines = [
    row('smoke', outcomeValue(run)),
    row(
      'dev server',
      `${run.devServerUrl}${SEPARATOR}${chalk.dim(`via ${run.discovery?.source ?? 'default'}${run.started ? ', started by this run' : ''}`)}`
    ),
    ...run.phases.map((phase) => row('', phaseLine(phase))),
  ];

  if (run.screenshot.ok) {
    lines.push(row('screenshot', run.screenshot.path));
  }

  // What this run did to the machine, said out loud and only by the runs that did something. A run
  // that started a dev server and booted a simulator changed what is on the developer's laptop,
  // and the two facts they need are that it happened and that it was undone.
  const environment = environmentLine(run);
  if (environment) {
    lines.push(row('environment', environment));
  }
  for (const cleanup of run.environment.cleanup) {
    if (!cleanup.ok) {
      // Loud, and never folded into the verdict: the app may be perfectly fine and there is still
      // something running that this run put there.
      lines.push(
        row(
          '',
          chalk.yellow(
            `left behind${SEPARATOR}the ${cleanupName(cleanup.resource)}${
              cleanup.target ? ` ${cleanup.target}` : ''
            } this run started did not stop: ${cleanup.reason}`
          )
        )
      );
    }
  }

  // The records last and fenced, because everything in them is a string the app produced.
  if (run.errors.length > 0) {
    lines.push(
      wrapUntrustedAppOutput(
        run.errors
          .map((error, index) =>
            [
              // What the app did, in the terms this command decides on: an `Error` it reported —
              // which on React Native is how an uncaught throw arrives — or a line it logged.
              `[${index + 1}] ${isFailingRecord(error) ? 'error reported by the app' : 'console.error'}`,
              `message: ${error.message}`,
              ...(error.stack ? ['stack:', error.stack] : []),
            ].join('\n')
          )
          .join('\n\n')
      )
    );
  }

  lines.push(
    row(
      'took',
      `${formatDuration(run.durationMs)}${options.route ? `${SEPARATOR}${chalk.dim(`route ${options.route}`)}` : ''}`
    )
  );
  return lines.join('\n');
}

/**
 * What this run started and put back, or null when it started nothing.
 *
 * Only the runs that acted get a line. "Reused the dev server that was already up" is the ordinary
 * case and saying it every time would bury the case that matters (llp/0005 §The run brings its own
 * environment).
 */
function environmentLine(run: SmokeRun): string | null {
  const acts: string[] = [];
  if (run.environment.devServer === 'started') {
    acts.push(`started the dev server${stoppedSuffix(run, 'dev-server')}`);
  }
  if (run.environment.device === 'booted') {
    // Which device, **and on what grounds**: a machine has ten simulators and this run picked one
    // of them (llp/0005 §The device that can open the app).
    acts.push(
      `booted ${run.deviceId ?? 'a device'}${
        run.environment.deviceChoice ? chalk.dim(` — ${run.environment.deviceChoice}`) : ''
      }${stoppedSuffix(run, 'device')}`
    );
  }
  return acts.length > 0 ? acts.join(SEPARATOR) : null;
}

/** Whether the thing this run started went back, in the words the cleanup reported. */
function stoppedSuffix(run: SmokeRun, resource: SmokeResource): string {
  const cleanup = run.environment.cleanup.find((entry) => entry.resource === resource);
  if (cleanup == null) {
    return chalk.dim(' · still running');
  }
  return cleanup.ok ? chalk.dim(' · stopped again') : chalk.yellow(' · NOT stopped');
}

/** The word a person uses for one of the two things a run can bring. */
function cleanupName(resource: SmokeResource): string {
  return resource === 'dev-server' ? 'dev server' : 'device';
}

/** The verdict, in the word an agent reads and a colour a person does. */
function outcomeValue(run: SmokeRun): string {
  switch (run.outcome) {
    case 'passed':
      return chalk.green('passed');
    case 'failed':
      return chalk.red('failed');
    default:
      return chalk.yellow('inconclusive');
  }
}

/** One phase, as `status  id · reason`. */
function phaseLine(phase: SmokePhase): string {
  const mark =
    phase.status === 'ok'
      ? chalk.green('ok')
      : phase.status === 'failed'
        ? chalk.red('failed')
        : phase.status === 'inconclusive'
          ? chalk.yellow('unknown')
          : chalk.dim('skipped');
  const timing = phase.ms > 0 ? chalk.dim(` ${formatDuration(phase.ms)}`) : '';
  return `${mark.padEnd(18)}${phase.id}${timing}${phase.reason ? chalk.dim(`${SEPARATOR}${phase.reason}`) : ''}`;
}

/** Milliseconds, in the unit a reader thinks in: `840ms`, `4.2s`. */
export function formatDuration(ms: number): string {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

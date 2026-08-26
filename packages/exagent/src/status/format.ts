// @ref llp/0004-smart-start-and-project-state.rfc.md §`exagent status`
// The human half of the status contract: one labelled line per section, like `git status` short
// prose. Agents read the `--json` report or the `cli:status` event instead.

import chalk from 'chalk';

import type {
  AuthStatus,
  DevServerStatus,
  ExpoGoStatus,
  FreshnessStatus,
  LocalDeviceStatus,
  NextActionStatus,
  ProjectStatus,
  SkillsStatus,
  StatusReport,
  StatusSectionName,
} from './types';

/** Width of the label column, matching the other commands. */
const LABEL_WIDTH = 12;

/** Separates the facts inside one line. */
const SEPARATOR = ' · ';

/** How much of an error message fits on a status line. The rest is in `--json`. */
const ERROR_MAX_LENGTH = 100;

/** Render the report as one line per section. */
export function formatStatusReport(report: StatusReport): string {
  return [
    row('project', report.project, projectLine, report, 'project'),
    row('expo go', report.expoGo, expoGoLine, report, 'expoGo'),
    row('freshness', report.freshness, freshnessLine, report, 'freshness'),
    row('dev server', report.devServer, devServerLine, report, 'devServer'),
    row('device', report.device, deviceLine, report, 'device'),
    // @ref llp/0004-smart-start-and-project-state.rfc.md §`exagent status`
    // The one section that can have nothing to say at all. A project whose dependencies ship no
    // skills, read by somebody who has selected no agent, produced `no agent selected · no skills
    // discovered` — a line about two things that are not there, on a report whose other six lines
    // are facts about the project [observed — dogfood, 2026-08-24]. The section stays in `--json`,
    // where a key that is always present is the contract (llp/0006 §Output contract).
    ...(hasSkillsToReport(report)
      ? [row('skills', report.skills, skillsLine, report, 'skills')]
      : []),
    row('auth', report.auth, authLine, report, 'auth'),
    row('next', report.next, nextLine, report, 'next'),
  ].join('\n');
}

/** Whether the skills line would say anything: an agent is selected, or a skill was found. */
function hasSkillsToReport(report: StatusReport): boolean {
  // A section that could not be read has a reason worth printing, whatever it would have said.
  if (report.skills == null) {
    return true;
  }
  return !!report.skills.agentIds?.length || report.skills.discovered > 0;
}

/** One labelled line, or the note that explains why the section is missing. */
function row<Section>(
  label: string,
  section: Section | null,
  format: (section: Section) => string,
  report: StatusReport,
  name: StatusSectionName
): string {
  const value = section == null ? unavailableLine(report, name) : format(section);
  return `${chalk.dim(label.padEnd(LABEL_WIDTH))}${value}`;
}

function unavailableLine(report: StatusReport, name: StatusSectionName): string {
  const error = report.errors[name];
  return chalk.yellow(error ? `unavailable: ${summarize(error)}` : 'unavailable');
}

function projectLine(project: ProjectStatus): string {
  const dirs = (['ios', 'android'] as const).filter((platform) => project.nativeDirs[platform]);
  return [
    project.name ?? 'unnamed project',
    `SDK ${project.sdkVersion ?? chalk.yellow('unknown')}`,
    project.native === 'bare' && dirs.length ? `bare (${dirs.join(', ')})` : 'CNG',
    project.usesDevClient ? 'dev client' : 'no dev client',
    project.hasWeb ? 'web' : 'no web',
  ].join(SEPARATOR);
}

function expoGoLine(expoGo: ExpoGoStatus): string {
  if (expoGo.compatible) {
    return chalk.green('compatible');
  }
  const reasons = pluralize(expoGo.reasonCount, 'reason', 'reasons');
  return chalk.yellow(`not compatible (${expoGo.reasonCount} ${reasons})`);
}

function freshnessLine(freshness: FreshnessStatus): string {
  const platforms = freshness.platforms.map((platform) => {
    const state = platform.state === 'fresh' ? chalk.green('fresh') : chalk.yellow(platform.state);
    return `${platform.platform}: ${state}${platform.detail ? ` (${platform.detail})` : ''}`;
  });
  // The fingerprint error explains every `unknown` above it, so it belongs on the same line.
  if (freshness.error) {
    platforms.push(chalk.dim(`fingerprint error: ${summarize(freshness.error)}`));
  }
  return platforms.join(SEPARATOR);
}

function devServerLine(devServer: DevServerStatus): string {
  if (!devServer.running) {
    return `${chalk.dim('not running')} (${devServer.url})`;
  }
  const apps = pluralize(devServer.appsConnected, 'app', 'apps');
  const facts = [
    `${chalk.green('running')} on ${devServer.url}`,
    chalk.dim(`via ${devServer.source}`),
    bundlerFact(devServer.ready),
    `${devServer.appsConnected} ${apps} connected`,
  ];
  // Named, never silently dropped: the count above is smaller than the dev server's own list, and
  // a reader comparing this line with `/json/list` has to be told why (F56).
  if (devServer.appsStale > 0) {
    facts.push(
      chalk.yellow(
        `${devServer.appsStale} stale ${pluralize(devServer.appsStale, 'target', 'targets')} still listed`
      )
    );
  }
  // Only worth a word when it is the bad answer: a dev server that proved it serves this project
  // is what the reader already assumed.
  if (devServer.projectRootMatched === false) {
    facts.push(chalk.yellow('serves another project'));
  }
  const reach = reachFact(devServer);
  if (reach) {
    facts.push(reach);
  }
  return facts.join(SEPARATOR);
}

/**
 * Where a device off this machine reaches the dev server, when that is not the `url` above.
 *
 * A word only when it adds one. `http://127.0.0.1:8081` already says "this machine", and a LAN
 * address already says "this network", so the one case worth a fact is a tunnel — an address the
 * line above does not contain at all. Reporting only the listen address of a tunnelled run is what
 * left a dogfood session pointing a cloud simulator at `127.0.0.1` [observed — 2026-08-24];
 * `hostType` rides along in `--json` for a reader that wants all three.
 */
function reachFact(devServer: DevServerStatus): string | null {
  return devServer.tunnelUrl ? `${chalk.green('tunnel')} ${devServer.tunnelUrl}` : null;
}

/**
 * What this machine has to open the app on.
 *
 * Its own line because it changes what every other suggestion is worth. `unknown` is never rounded
 * down to "none": a machine whose platform tools could not be run has not been shown to have no
 * device, and the difference is what keeps `navigate` on the ladder where it belongs.
 */
function deviceLine(device: LocalDeviceStatus): string {
  if (device.state === 'present') {
    const label = device.name ? `${device.name} (${device.deviceId})` : device.deviceId;
    return [chalk.green(device.platform ?? 'device'), label ?? ''].filter(Boolean).join(' ');
  }
  if (device.state === 'absent') {
    return [
      chalk.yellow('none'),
      chalk.dim(device.reason ?? 'no booted simulator and no attached device'),
    ].join(SEPARATOR);
  }
  return [
    chalk.yellow('unknown'),
    chalk.dim(device.reason ?? 'no platform tool could answer'),
  ].join(SEPARATOR);
}

/**
 * What the short readiness probe found.
 *
 * `null` is "still bundling", not "not ready": status never waits for a bundle, so a dev server
 * that has not answered yet is unknown here and `npx exagent dev:wait` is what settles it.
 */
function bundlerFact(ready: boolean | null): string {
  if (ready == null) {
    return chalk.dim('bundler still working');
  }
  return ready ? chalk.green('bundler ready') : chalk.yellow('bundler not ready');
}

function skillsLine(skills: SkillsStatus): string {
  const selected = !!skills.agentIds?.length;
  const agents = selected ? skills.agentIds!.join(', ') : chalk.yellow('no agent selected');
  if (skills.discovered === 0) {
    return [agents, chalk.dim('no skills discovered')].join(SEPARATOR);
  }
  const counts = selected
    ? `${skills.linked}/${skills.discovered} linked`
    : `${skills.discovered} ${pluralize(skills.discovered, 'skill', 'skills')} discovered`;
  return [agents, counts].join(SEPARATOR);
}

/**
 * Who the CLI family acts as, and what said so.
 *
 * "Unknown" is its own answer and is never rounded down to "signed out": the difference decides
 * whether an agent should hand a login to its user or simply start the command.
 */
function authLine(auth: AuthStatus): string {
  if (auth.loggedIn == null) {
    return chalk.yellow('unknown (nothing could answer)');
  }
  if (!auth.loggedIn) {
    return [chalk.yellow('not signed in'), chalk.dim(`per ${auth.source}`)].join(SEPARATOR);
  }
  return [chalk.green(auth.user ?? 'signed in'), chalk.dim(`per ${auth.source}`)].join(SEPARATOR);
}

function nextLine(next: NextActionStatus): string {
  const [first, ...rest] = next.steps;
  // A next action that is not the plan carries its own reason, and that reason is the whole of
  // what it has to say: there is no step list to print, because it runs one exagent command.
  if (next.why) {
    return `${chalk.bold(next.command)}${SEPARATOR}${chalk.dim(next.why)}`;
  }
  if (first == null) {
    return `${chalk.bold(next.command)} → ${next.rule}`;
  }
  const more = rest.length
    ? chalk.dim(` (+${rest.length} more ${pluralize(rest.length, 'step', 'steps')})`)
    : '';
  return `${chalk.bold(next.command)} → ${next.rule}: ${chalk.cyan(first.argv.join(' '))}${more}`;
}

function pluralize(count: number, single: string, plural: string): string {
  return count === 1 ? single : plural;
}

/**
 * Fit an error message on one status line.
 *
 * Errors are written to be read in full elsewhere: they explain what, why and how, over several
 * lines. A status line shows the beginning of the first line, and `--json` (or the command the
 * section points at) carries the rest.
 */
function summarize(message: string): string {
  const line = message.split('\n')[0]!;
  return line.length > ERROR_MAX_LENGTH ? `${line.slice(0, ERROR_MAX_LENGTH).trimEnd()}…` : line;
}

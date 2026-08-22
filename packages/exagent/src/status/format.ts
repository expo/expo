// @ref llp/0004-smart-start-and-project-state.rfc.md §`exagent status`
// The human half of the status contract: one labelled line per section, like `git status` short
// prose. Agents read the `--json` report or the `cli:status` event instead.

import chalk from 'chalk';

import type {
  DevServerStatus,
  ExpoGoStatus,
  FreshnessStatus,
  NextActionStatus,
  ProjectStatus,
  SkillsStatus,
  StatusReport,
  StatusSectionName,
} from './types';

/** Width of the label column, matching `exagent context`. */
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
    row('skills', report.skills, skillsLine, report, 'skills'),
    row('next', report.next, nextLine, report, 'next'),
  ].join('\n');
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
  return [
    `${chalk.green('running')} on ${devServer.url}`,
    `${devServer.appsConnected} ${apps} connected`,
  ].join(SEPARATOR);
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

function nextLine(next: NextActionStatus): string {
  const [first, ...rest] = next.steps;
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

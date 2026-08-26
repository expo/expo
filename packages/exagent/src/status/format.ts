// @ref llp/0004-smart-start-and-project-state.rfc.md §`exagent status`
// The human half of the status contract: one labelled line per section, like `git status` short
// prose. Agents read the `--json` report or the `cli:status` event instead.

import chalk from 'chalk';

import type { ImpactClass, OtaSafety } from '../impact/types';
import type { PlanBuildLocation } from '../toolchain/types';
import type {
  AssertStatus,
  AuthStatus,
  BuildsStatus,
  DevServerStatus,
  FreshnessImpact,
  PlatformFreshness,
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
    // @ref llp/0004-smart-start-and-project-state.rfc.md §The impact headline is free, the explanation is not
    // What has changed since that build, and what it costs. Its own line rather than a clause on
    // `freshness`, for the reason the `build` line is its own: `stale` is a fact and this is what
    // to do about it, and a reader scanning for the second should not have to parse the first.
    // Left out when nothing was classified — the freshness line has already said why.
    ...impactLines(report),
    // The per-source list and the OTA verdict, under `--explain` only.
    ...explainLines(report),
    // @ref llp/0004-smart-start-and-project-state.rfc.md §The EAS build lookup, and why it is opt-in
    // Printed only when it says something, for the reason the skills line is: a default run has
    // nothing cached and asked nobody, and `ios: unknown · android: unknown (EAS was not asked)` is
    // two non-facts on a report of facts. The key is always in `--json`, where a key that is always
    // present is the contract (llp/0006 §Output contract).
    ...(hasBuildsToReport(report)
      ? [row('eas build', report.builds, buildsLine, report, 'builds')]
      : []),
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
    // @ref llp/0015-backend-selection-and-config.rfc.md §What `status` reports
    // Only when the next plan contains a build, because only then is there a place for it to run.
    // Its own line rather than a clause on `next`: where the build happens decides what the caller
    // needs — a toolchain here, or an account and a queue — and that is not a detail of a command
    // name. On a host that cannot build for the target platform, this is the line that says the
    // next build is a cloud one, before anybody waits many minutes to find out.
    ...(report.next?.buildLocation
      ? [`${chalk.dim('build'.padEnd(LABEL_WIDTH))}${buildLine(report.next.buildLocation)}`]
      : []),
    // @ref llp/0004-smart-start-and-project-state.rfc.md §An explicit flag turns the report into a gate
    // Last, because it is a judgment on everything above it, and only when one was asked for.
    ...(report.assertion ? ['', assertLine(report.assertion)] : []),
  ].join('\n');
}

/** How many changed sources are listed under `--explain` before the rest become a count. */
const MAX_LISTED_SOURCES = 8;

/**
 * The `--assert` verdict, and the reason behind it.
 *
 * Three colors for three outcomes rather than two, because the middle one is a different problem
 * with a different fix: red is "the change costs more than you said", yellow is "nothing was
 * measured, so there was nothing to gate on".
 */
function assertLine(assertion: AssertStatus): string {
  const verdict = assertion.ok
    ? chalk.green(`${assertion.asserted} — the change costs at most that`)
    : assertion.actual == null
      ? chalk.yellow(`${assertion.asserted} — not verified (exit ${assertion.exitCode})`)
      : chalk.red(
          `${assertion.asserted} — the change costs ${assertion.actual} (exit ${assertion.exitCode})`
        );
  return [
    `${chalk.dim('assert'.padEnd(LABEL_WIDTH))}${verdict}`,
    `${' '.repeat(LABEL_WIDTH)}${chalk.dim(assertion.reason)}`,
  ].join('\n');
}

/**
 * The impact headline, one entry per platform that has one.
 *
 * Platforms that agree are printed once. They usually do, and for a reason worth knowing: the
 * probe fingerprints both platforms together (llp/0004 §`exagent status`), so `ios` and `android`
 * differ here only when their recorded builds were made at different times. Printing the identical
 * sentence twice would be the report padding itself.
 */
function impactLines(report: StatusReport): string[] {
  const decided = (report.freshness?.platforms ?? []).filter(
    (platform): platform is PlatformFreshness & { impact: FreshnessImpact } =>
      platform.impact?.class != null
  );
  if (!decided.length) {
    return [];
  }

  const grouped = new Map<string, { platforms: string[]; impact: FreshnessImpact }>();
  for (const platform of decided) {
    // A separator that cannot occur in either half, so two entries group together only when
    // they really say the same thing. Written as an escape: a raw control character in
    // source makes git treat the file as binary.
    const key = `${platform.impact.class}\u0000${platform.impact.reason}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.platforms.push(platform.platform);
    } else {
      grouped.set(key, { platforms: [platform.platform], impact: platform.impact });
    }
  }

  // Which base the class was measured against, but only when it is not the usual one: "since the
  // last build this CLI made" is what a reader already assumes, and a line that said so on every
  // run would be a word repeated forever to make one rare run legible.
  const against =
    report.freshness?.comparison.kind === 'eas-build'
      ? `${chalk.dim(`vs ${report.freshness.comparison.label}`)}${SEPARATOR}`
      : '';

  return [...grouped.values()].map(({ platforms, impact }) => {
    const value = [
      `${platforms.join(', ')}: ${impactClassText(impact.class!)}`,
      chalk.dim(summarize(impact.reason)),
    ].join(SEPARATOR);
    return `${chalk.dim('impact'.padEnd(LABEL_WIDTH))}${against}${value}`;
  });
}

/** The class, colored by what it costs the reader. */
function impactClassText(impactClass: ImpactClass): string {
  switch (impactClass) {
    case 'js-only':
      return chalk.green('js-only');
    case 'dev-client-compatible':
      return chalk.yellow('dev-client-compatible');
    case 'needs-native-build':
      return chalk.red('needs-native-build');
  }
}

/**
 * What `--explain` adds to the terminal: the sources that moved, and the OTA verdict.
 *
 * Both are recognisable by their data rather than by a flag: `changedSources` is null unless the
 * caller asked, and `ota` is null unless it was resolved. So the formatter stays a pure function of
 * the report, and `--json` and the text can never disagree about what was asked for.
 */
function explainLines(report: StatusReport): string[] {
  const lines: string[] = [];
  const indent = ' '.repeat(LABEL_WIDTH);

  for (const platform of report.freshness?.platforms ?? []) {
    const sources = platform.impact?.changedSources;
    if (!sources?.length) {
      continue;
    }
    lines.push(`${chalk.dim(`${platform.platform} changed`.padEnd(LABEL_WIDTH))}${sources.length}`);
    for (const source of sources.slice(0, MAX_LISTED_SOURCES)) {
      lines.push(
        `${indent}${chalk.dim(source.op.padEnd(8))}${source.path ?? '(unnamed)'} ${chalk.dim(`[${source.kind}]`)}`
      );
    }
    const hidden = sources.length - MAX_LISTED_SOURCES;
    if (hidden > 0) {
      lines.push(`${indent}${chalk.dim(`… and ${hidden} more, in --json`)}`);
    }
  }

  // The file-level view, which is what decided `js-only` against `dev-client-compatible`. Only
  // read when the fingerprint said the native surface did not move, so its presence is itself the
  // fact that the class came from here rather than from the fingerprint.
  const files = report.freshness?.changedFiles;
  // A tree with nothing changed in it produces a row of zeros, which is the "line about things
  // that are not there" the skills line already learned to leave out.
  if (files && files.total > 0) {
    lines.push(
      `${chalk.dim('files'.padEnd(LABEL_WIDTH))}${files.total} changed${SEPARATOR}${files.js} js${SEPARATOR}${files.config} config${SEPARATOR}${files.native} native`
    );
  }

  const ota = report.freshness?.ota;
  if (ota) {
    lines.push(`${chalk.dim('ota'.padEnd(LABEL_WIDTH))}${otaLine(ota)}`);
    lines.push(`${indent}${chalk.dim(ota.why)}`);
  }
  return lines;
}

/**
 * Whether an update published now reaches the builds people have installed.
 *
 * `unknown` is its own answer here as everywhere else: a `runtimeVersion` policy nothing could
 * resolve has not established that an update is safe, and `false` would be as much of an invention
 * as `true`.
 */
function otaLine(ota: OtaSafety): string {
  const verdict =
    ota.safe == null
      ? chalk.yellow('unknown')
      : ota.safe
        ? chalk.green('safe to publish')
        : chalk.red('not safe to publish');
  const policy = ota.runtimeVersion.policy
    ? `policy ${ota.runtimeVersion.policy}`
    : ota.runtimeVersion.literal
      ? `literal ${ota.runtimeVersion.literal}`
      : 'runtimeVersion unresolved';
  const source = ota.runtimeVersion.source ? chalk.dim(` (${ota.runtimeVersion.source})`) : '';
  return `${verdict}${SEPARATOR}${policy}${source}`;
}

/** Where the next plan's build runs, and the one clause that says what chose that. */
function buildLine(location: PlanBuildLocation): string {
  const where = location.runsOn === 'eas' ? chalk.yellow('eas') : chalk.green('local');
  const because = location.selection
    ? location.selection.doomed
      ? chalk.red(location.selection.because)
      : chalk.dim(location.selection.because)
    : chalk.dim(`needs ${location.requirement}; nothing chose this`);
  return [where, because].join(SEPARATOR);
}

/**
 * Whether the EAS-build line would say anything.
 *
 * Three cases, and they are the three that carry information: a build was found (which changes what
 * to do next), the caller asked outright with `--builds` (they are owed the answer whatever it is),
 * or the section could not be read at all (the reason is worth printing). A default run with an
 * empty cache is silent here, because "nobody asked" is not a fact about the project.
 */
function hasBuildsToReport(report: StatusReport): boolean {
  if (report.builds == null) {
    return true;
  }
  return report.builds.askedEas || report.builds.platforms.some((p) => p.state === 'found');
}

/**
 * What EAS already has, per platform, and the command that installs it.
 *
 * A `found` is the only state that names a command, and it names it on the line rather than leaving
 * it to a follow-up: this is the line that turns a `stale` two rows above from "rebuild, fifteen
 * minutes" into "download, one minute", and the reader has to be able to act on it where they read
 * it.
 */
function buildsLine(builds: BuildsStatus): string {
  const found = builds.platforms.filter((platform) => platform.state === 'found');
  const facts = builds.platforms.map((platform) => {
    if (platform.state === 'found') {
      // The day, not the instant: which build it is comes from the id below, and a millisecond
      // precision timestamp on a status line is six characters of noise. `--json` keeps it whole.
      const details = [platform.buildProfile, platform.createdAt?.slice(0, 10)]
        .filter(Boolean)
        .join(', ');
      return `${platform.platform}: ${chalk.green('finished build')}${details ? ` (${details})` : ''}`;
    }
    // A `none` needs no gloss: the word is the whole answer, and printing "EAS has no finished
    // build made from this fingerprint" beside it twice says it three times. An `unknown` is the
    // opposite — the reason is the only thing that makes it worth a line.
    if (platform.state === 'none') {
      return `${platform.platform}: ${chalk.dim('none')}`;
    }
    return `${platform.platform}: ${chalk.yellow('unknown')}${platform.reason ? chalk.dim(` (${summarize(platform.reason)})`) : ''}`;
  });

  // One command, for the first platform that has one: a line cannot carry two, and the `--json`
  // report and the follow-ups carry the rest.
  const first = found[0];
  if (first?.buildId) {
    facts.push(chalk.cyan(`npx eas build:download --build-id ${first.buildId}`));
  }
  return facts.join(SEPARATOR);
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
 * that has not answered yet is unknown here and `npx exagent smoke` is what settles it.
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

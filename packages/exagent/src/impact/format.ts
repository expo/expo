// @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract — "one fact per line, label value
// style". The same facts as `--json`, in the shape a terminal and a model reading a terminal both
// get through in one pass.

import chalk from 'chalk';

import type { ImpactClass, ImpactReport, PlatformImpact } from './types';

/** Width of the label column, matching `status`, `deploy` and `build:wait`. */
const LABEL_WIDTH = 12;

/** How many changed sources are listed before the rest become a count. */
const MAX_LISTED_SOURCES = 5;

/** One line per fact the classification produced. */
export function formatImpactReport(report: ImpactReport): string {
  const lines: string[] = [];
  const row = (label: string, value: string) =>
    lines.push(`${chalk.dim(label.padEnd(LABEL_WIDTH))}${value}`);

  row('impact', classLine(report.class));
  row('comparison', comparisonLine(report));
  row('preset', report.comparison.preset);

  for (const platform of report.platforms) {
    lines.push('');
    // A `--build` comparison names no platform, because the build's own is what it was for.
    row(platform.platform ?? 'build', platformLine(platform));
    for (const reason of platform.reasons) {
      lines.push(`${' '.repeat(LABEL_WIDTH)}${chalk.dim('·')} ${reason}`);
    }
    for (const source of platform.changedSources.slice(0, MAX_LISTED_SOURCES)) {
      lines.push(
        `${' '.repeat(LABEL_WIDTH)}${chalk.dim(source.op.padEnd(8))}${source.path ?? '(unnamed)'} ${chalk.dim(`[${source.kind}]`)}`
      );
    }
    const hidden = platform.changedSources.length - MAX_LISTED_SOURCES;
    if (hidden > 0) {
      lines.push(`${' '.repeat(LABEL_WIDTH)}${chalk.dim(`… and ${hidden} more, in --json`)}`);
    }
    if (platform.cachedBuild?.id) {
      row('cached build', cachedBuildLine(platform));
    }
  }

  lines.push('');
  row('ota', otaLine(report));
  lines.push(`${' '.repeat(LABEL_WIDTH)}${chalk.dim('·')} ${report.ota.why}`);

  if (report.changedFiles) {
    lines.push('');
    const { total, native, js, config } = report.changedFiles;
    row('files', `${total} changed · ${js} js · ${config} config · ${native} native`);
  }

  if (report.assertion) {
    lines.push('');
    row(
      'assert',
      report.assertion.ok
        ? chalk.green(`${report.assertion.asserted} — the real class is at most that`)
        : chalk.red(
            `${report.assertion.asserted} — the real class is ${report.class}, which is stronger`
          )
    );
  }

  if (report.caveats.length) {
    lines.push('');
    lines.push(chalk.dim('What this cannot establish exactly:'));
    for (const caveat of report.caveats) {
      lines.push(chalk.dim(`  · ${caveat}`));
    }
  }

  return lines.join('\n');
}

/** The class, plus the sentence that says what it means for the caller. */
function classLine(impactClass: ImpactClass): string {
  switch (impactClass) {
    case 'js-only':
      return chalk.green('js-only — Fast Refresh picks this up; nothing has to be restarted');
    case 'dev-client-compatible':
      return chalk.yellow(
        'dev-client-compatible — the installed app still runs this; restart Metro'
      );
    case 'needs-native-build':
      return chalk.red('needs-native-build — the app has to be built again');
  }
}

function comparisonLine(report: ImpactReport): string {
  const { base, head } = report.comparison;
  return `${base.label} ${chalk.dim(short(base.hash))} → ${head.label} ${chalk.dim(short(head.hash))}`;
}

function platformLine(platform: PlatformImpact): string {
  const changed =
    platform.fingerprintChanged == null
      ? chalk.yellow('fingerprint unknown')
      : platform.fingerprintChanged
        ? chalk.red('fingerprint changed')
        : chalk.green('fingerprint unchanged');
  return `${platform.class} · ${changed}`;
}

function cachedBuildLine(platform: PlatformImpact): string {
  const build = platform.cachedBuild!;
  return chalk.green(
    `${build.id} (${build.status ?? 'finished'}${build.createdAt ? `, ${build.createdAt}` : ''}) already matches this fingerprint`
  );
}

function otaLine(report: ImpactReport): string {
  const policy = report.ota.runtimeVersion.policy
    ? `policy ${report.ota.runtimeVersion.policy}`
    : report.ota.runtimeVersion.literal
      ? `literal ${report.ota.runtimeVersion.literal}`
      : 'runtimeVersion unresolved';
  const verdict =
    report.ota.safe == null
      ? chalk.yellow('unknown')
      : report.ota.safe
        ? chalk.green('safe')
        : chalk.red('not safe');
  return `${verdict} · ${policy}${report.ota.runtimeVersion.source ? chalk.dim(` (${report.ota.runtimeVersion.source})`) : ''}`;
}

/** How much of a hash reads on a line. The whole one is in `--json`. */
function short(hash: string | null): string {
  return hash ? hash.slice(0, 12) : 'none';
}

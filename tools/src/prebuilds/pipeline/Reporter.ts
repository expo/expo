/**
 * Build summary reporting and error log writing.
 *
 * Moved from PrebuildPackages.ts and adapted to consume `UnitStatus[]`
 * instead of the old `ProductBuildStatus[]`.
 */
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

import logger from '../../Logger';
import type { SPMPackageSource } from '../ExternalPackage';
import { Frameworks } from '../Frameworks';
import type { BuildFlavor } from '../Prebuilder.types';
import type { UnitError, UnitStatus, StageStatus } from './Types';

// ---------------------------------------------------------------------------
// Package banner
// ---------------------------------------------------------------------------

export function logPackageBanner(
  pkg: SPMPackageSource,
  index: number,
  total: number,
  flavors: BuildFlavor[],
  artifactsPath: string
): void {
  const flavorInfo = flavors.length > 1 ? ` [${flavors.join(' + ')}]` : ` [${flavors[0]}]`;
  logger.info(
    `\n📦 [${chalk.dim(`${index + 1}/${total}`)}] ${chalk.green(pkg.packageName)}${flavorInfo}`
  );
  logger.info(`${'─'.repeat(60)}`);
  const relPath = (p: string) => path.relative(process.cwd(), p);
  logger.info(`   ・Package:      ${chalk.dim(relPath(pkg.path))}`);
  logger.info(`   ・Build:        ${chalk.dim(relPath(pkg.buildPath))}`);
  logger.info(`   ・Cache:        ${chalk.dim(relPath(artifactsPath))}`);
  logger.info(
    `   ・XCFrameworks: ${chalk.dim(relPath(Frameworks.getFrameworksOutputPath(pkg.buildPath, flavors[0], pkg.outputVersionPrefix)).replace(`/${flavors[0].toLowerCase()}`, '/<flavor>'))}`
  );
}

// ---------------------------------------------------------------------------
// Duration formatting
// ---------------------------------------------------------------------------

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    const remainingSeconds = seconds % 60;
    return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  } else if (seconds > 0) {
    return `${seconds}s`;
  } else {
    return `${ms}ms`;
  }
}

// ---------------------------------------------------------------------------
// Summary printer
// ---------------------------------------------------------------------------

function stageIcon(status: StageStatus): string {
  switch (status) {
    case 'success':
      return '✅';
    case 'failed':
      return '❌';
    case 'warning':
      return '⚠️';
    case 'skipped':
      return '⏭️';
  }
}

export interface SummaryCounts {
  successful: number;
  warnings: number;
  failed: number;
}

export function computeSummaryCounts(statuses: UnitStatus[]): SummaryCounts {
  // A unit with skipReason is never successful, regardless of stage values
  // (all 'skipped' by construction) — that's what flips skipped-due-to-dep
  // into the failed bucket.
  const isOk = (st: StageStatus) => st === 'success' || st === 'skipped';
  const successful = statuses.filter(
    (s) =>
      !s.skipReason &&
      isOk(s.stages.generate) &&
      isOk(s.stages.build) &&
      isOk(s.stages.compose) &&
      (isOk(s.stages.verify) || s.stages.verify === 'warning')
  ).length;
  const warnings = statuses.filter((s) => !s.skipReason && s.stages.verify === 'warning').length;
  return { successful, warnings, failed: statuses.length - successful };
}

export function printPrebuildSummary(statuses: UnitStatus[], elapsedMs: number): void {
  if (statuses.length === 0) {
    return;
  }

  logger.info('\n📊 Build Summary:');
  logger.info('─'.repeat(80));

  for (const status of statuses) {
    const productDisplay =
      status.packageName === status.productName
        ? chalk.cyan(status.packageName)
        : `${chalk.cyan(status.packageName)}/${chalk.yellow(`${status.productName} [${status.flavor}]`)}`;

    if (status.skipReason) {
      logger.info(`${productDisplay}: ${chalk.red('⛔ Skipped')} (${status.skipReason})`);
      continue;
    }

    logger.info(
      `${productDisplay}: Gen ${stageIcon(status.stages.generate)} | Build ${stageIcon(status.stages.build)} | Compose ${stageIcon(status.stages.compose)} | Verify ${stageIcon(status.stages.verify)}`
    );
  }

  const { successful, warnings, failed } = computeSummaryCounts(statuses);

  logger.info('─'.repeat(80));
  const warningText = warnings > 0 ? ` | ${chalk.yellow(`⚠️  ${warnings} with warnings`)}` : '';
  const failedText = failed > 0 ? ` | ${chalk.red(`❌ ${failed} failed`)}` : '';
  const timeText = chalk.blue(`⏱️  ${formatDuration(elapsedMs)}`);
  logger.info(
    `Total: ${statuses.length} | ${chalk.green(`✅ ${successful} successful`)}${warningText}${failedText} | ${timeText}`
  );
}

// ---------------------------------------------------------------------------
// Error log writer
// ---------------------------------------------------------------------------

export function writeErrorLog(rootPath: string, errors: UnitError[]): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logFileName = `prebuild-errors-${timestamp}.log`;
  const logPath = path.join(rootPath, logFileName);

  const logContent = errors
    .map((err) => {
      return `
================================================================================
Package: ${err.packageName}
Product: ${err.productName}
Flavor:  ${err.flavor}
Stage:   ${err.stage}
Time:    ${new Date().toISOString()}
--------------------------------------------------------------------------------
Error: ${err.error.message}
${err.error.stack ? `\nStack trace:\n${err.error.stack}` : ''}
================================================================================
`;
    })
    .join('\n');

  const header = `Prebuild Errors Log
Generated: ${new Date().toISOString()}
Total Errors: ${errors.length}
${'='.repeat(80)}
`;

  fs.writeFileSync(logPath, header + logContent, 'utf-8');
  return logPath;
}

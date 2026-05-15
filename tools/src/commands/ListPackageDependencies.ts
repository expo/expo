import { Command } from '@expo/commander';
import chalk from 'chalk';

import logger from '../Logger';
import { DependencyKind, getListOfPackagesAsync } from '../Packages';
import {
  isNCCBuilt,
  scanDependenciesAsync,
  type ScannedDependency,
} from '../check-packages/scanDependenciesAsync';

const { green, yellow, red, cyan, gray, bold } = chalk;

type ActionOptions = {
  json: boolean;
  undeclared: boolean;
  devOnly: boolean;
};

type PackageCheckType = 'package' | 'plugin' | 'cli' | 'utils';

export default (program: Command) => {
  program
    .command('list-package-dependencies <packageNames...>')
    .alias('lpd')
    .option('--json', 'Output as JSON.', false)
    .option(
      '--undeclared',
      'Only show imports that have no matching dependency in package.json.',
      false
    )
    .option('--dev-only', 'Only show imports that resolve to devDependencies.', false)
    .description('Lists external dependencies found in source code for each package.')
    .asyncAction(main);
};

async function main(packageNames: string[], options: ActionOptions): Promise<void> {
  const allPackages = await getListOfPackagesAsync();
  const monorepoPackageNames = new Set(allPackages.map((p) => p.packageName));

  if (!packageNames.length) {
    logger.error('Specify at least one package name.');
    process.exit(1);
  }

  const packages = allPackages.filter((pkg) => packageNames.includes(pkg.packageName));
  const found = new Set(packages.map((p) => p.packageName));
  for (const name of packageNames) {
    if (!found.has(name)) {
      logger.warn(`Package ${yellow(name)} not found in monorepo.`);
    }
  }

  if (!packages.length) {
    logger.error('No packages matched.');
    process.exit(1);
  }

  const jsonOutput: Record<string, object[]> = {};

  for (const pkg of packages) {
    if (isNCCBuilt(pkg)) {
      continue;
    }

    const checkTypes: PackageCheckType[] = ['package'];
    if (pkg.hasPlugin) checkTypes.push('plugin');
    if (pkg.hasCli) checkTypes.push('cli');
    if (pkg.hasUtils) checkTypes.push('utils');

    for (const checkType of checkTypes) {
      const deps = await scanDependenciesAsync(pkg, checkType);

      let filtered = deps;
      if (options.undeclared) {
        filtered = filtered.filter((d) => d.kind === undefined);
      }
      if (options.devOnly) {
        filtered = filtered.filter((d) => d.kind === DependencyKind.Dev);
      }

      if (!filtered.length) {
        continue;
      }

      const label = checkType === 'package' ? pkg.packageName : `${pkg.packageName} (${checkType})`;

      if (options.json) {
        jsonOutput[label] = filtered.map((d) => ({
          packageName: d.packageName,
          kind: d.kind ?? null,
          isTypeOnly: d.isTypeOnly,
          isSideEffect: d.isSideEffect,
          files: d.files.map((f) => ({ path: f.relativePath, line: f.line })),
        }));
      } else {
        logger.log(`\n${green.bold(label)}`);
        printTable(filtered, monorepoPackageNames);
      }
    }
  }

  if (options.json) {
    logger.log(JSON.stringify(jsonOutput, null, 2));
  }
}

function printTable(deps: ScannedDependency[], monorepoPackageNames: Set<string>) {
  const rows = deps.map((d) => {
    const isInternal = monorepoPackageNames.has(d.packageName);
    return {
      dep: isInternal ? `${d.packageName}*` : d.packageName,
      isInternal,
      kind: kindLabel(d.kind),
      hints: buildHints(d),
      refs: d.files.map((f) => `${f.relativePath}:${f.line}`),
    };
  });

  // Sort internal dependencies first, then alphabetically
  rows.sort((a, b) => {
    if (a.isInternal !== b.isInternal) return a.isInternal ? -1 : 1;
    return a.dep.localeCompare(b.dep);
  });

  const GAP = 2;
  const depW = Math.max('Dependency'.length, ...rows.map((r) => r.dep.length)) + GAP;
  const kindW = Math.max('Kind'.length, ...rows.map((r) => r.kind.length)) + GAP;
  const hintsW = Math.max('Hints'.length, ...rows.map((r) => r.hints.length)) + GAP;

  const indent = '  ';

  // Header
  logger.log(
    indent +
      bold('Dependency'.padEnd(depW) + 'Kind'.padEnd(kindW) + 'Hints'.padEnd(hintsW) + 'References')
  );

  // Separator
  logger.log(
    indent +
      gray(
        '─'.repeat(depW - GAP).padEnd(depW) +
          '─'.repeat(kindW - GAP).padEnd(kindW) +
          '─'.repeat(hintsW - GAP).padEnd(hintsW) +
          '─'.repeat(10)
      )
  );

  const emptyPrefix = indent + ' '.repeat(depW + kindW + hintsW);

  for (const row of rows) {
    const firstRef = row.refs[0] ?? '';
    logger.log(
      indent +
        depCell(row.dep, row.isInternal, depW) +
        coloredCell(row.kind, kindW) +
        hintCell(row.hints, hintsW) +
        gray(firstRef)
    );

    for (let i = 1; i < row.refs.length; i++) {
      logger.log(emptyPrefix + gray(row.refs[i]));
    }
  }
}

function buildHints(dep: ScannedDependency): string {
  const parts: string[] = [];
  if (dep.isTypeOnly) {
    parts.push('types only');
  }
  if (dep.isSideEffect) {
    parts.push('side-effect');
  }
  return parts.join(', ');
}

function kindLabel(kind: DependencyKind | undefined): string {
  switch (kind) {
    case DependencyKind.Normal:
      return 'dependency';
    case DependencyKind.Dev:
      return 'devDependency';
    case DependencyKind.Peer:
      return 'peerDependency';
    case undefined:
      return 'undeclared';
    default:
      return kind;
  }
}

function depCell(text: string, isInternal: boolean, width: number): string {
  const colored = isInternal ? green(text) : text;
  return colored + ' '.repeat(Math.max(0, width - text.length));
}

/** Render a kind cell: colored text + plain padding to fill the column width */
function coloredCell(text: string, width: number): string {
  const colorFn = kindColorFn(text);
  return colorFn(text) + ' '.repeat(Math.max(0, width - text.length));
}

function kindColorFn(kind: string): (s: string) => string {
  switch (kind) {
    case 'dependency':
    case 'peerDependency':
      return cyan;
    case 'devDependency':
      return yellow;
    case 'undeclared':
      return red;
    default:
      return (s: string) => s;
  }
}

function hintCell(text: string, width: number): string {
  if (!text) {
    return ' '.repeat(width);
  }
  return yellow(text) + ' '.repeat(Math.max(0, width - text.length));
}

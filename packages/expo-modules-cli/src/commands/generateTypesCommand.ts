import type { ScanStats } from '@expo/expo-modules-macros-plugin';
import type { Command } from 'commander';
import path from 'path';

import { generateTypes, type GenerateTypesResult } from '../typegen/generateTypes';
import type { RenderWarning, RenderedDeclaration } from '../typegen/renderSurface';
import { styleFileName, styleKind, styleTypeName, styleWarningHeading } from './styles';

const DEFAULT_OUTPUT_PATH = path.join('src', 'native.types.ts');

type GenerateTypesCommandOptions = {
  out?: string;
  scanner?: string;
  check?: boolean;
};

export function generateTypesCommand(cli: Command) {
  cli
    .command('generate-types [packageDir]')
    .description(
      'Generates TypeScript types for the native API an Expo module exports to JavaScript: ' +
        'its @ExpoModule, @SharedObject, @Record, and @Union types and Enumerable enums. Scans the ' +
        'package directory (default: the current directory) for Swift sources and writes them to a ' +
        'single TypeScript file.'
    )
    .option(
      '-o, --out <path>',
      'The TypeScript file to write, relative to the package directory.',
      DEFAULT_OUTPUT_PATH
    )
    .option(
      '--scanner <path>',
      'Path to the Expo Modules scanner executable. Defaults to the scanner bundled with this CLI.'
    )
    .option(
      '--check',
      'Verify that the file is up to date without writing it. Exits with code 1 when it is not.'
    )
    .action(async (packageDirArg: string | undefined, options: GenerateTypesCommandOptions) => {
      const packageDir = path.resolve(packageDirArg ?? '.');
      const outputPath = path.resolve(packageDir, options.out ?? DEFAULT_OUTPUT_PATH);
      const scannerPath = options.scanner ? path.resolve(options.scanner) : undefined;

      const result = await generateTypes({
        packageDir,
        outputPath,
        scannerPath,
        check: options.check ?? false,
      });

      const { outcome } = result;
      const nothingFound = describeEmptyScan(result.stats, packageDir);
      const summary = `${describeCounts(result.counts)} from ${count(result.stats.filesParsed, 'Swift file')}.`;
      switch (outcome.kind) {
        case 'written':
          console.log(`Generated ${styleFileName(displayPath(outcome.outputPath))}: ${summary}`);
          console.log(listDeclarations(result.declarations, packageDir));
          break;
        case 'unchanged':
          console.log(
            `${styleFileName(displayPath(outcome.outputPath))} is up to date: ${summary}`
          );
          console.log(listDeclarations(result.declarations, packageDir));
          break;
        case 'removed':
          console.log(
            `${nothingFound} Removed the previously generated ` +
              `${styleFileName(displayPath(outcome.outputPath))}.`
          );
          break;
        case 'empty':
          console.log(`${nothingFound} Nothing was written.`);
          break;
        case 'stale': {
          const file = styleFileName(displayPath(outcome.outputPath), process.stderr);
          console.error(
            outcome.expected === 'written'
              ? `${file} is out of date. Run \`expo-modules generate-types\` to update it.`
              : `${file} is no longer needed: the package exports no native types. ` +
                  `Run \`expo-modules generate-types\` to remove it.`
          );
          process.exitCode = 1;
          break;
        }
      }
      // Warnings come last, under their own heading, so the actionable part of the output is what
      // stays on screen after the summary and the listing.
      const heading = describeWarnings(result.warnings);
      if (heading) {
        console.warn(`\n${styleWarningHeading(heading, process.stderr)}`);
        for (const warning of result.warnings) {
          const file = path.relative(packageDir, warning.file);
          console.warn(
            `  ${styleFileName(file, process.stderr)}: ${styleTypeName(warning.location, process.stderr)}: ` +
              warning.message
          );
        }
      }
    });
}

/** `1 module`, `2 modules`. */
function count(n: number, noun: string): string {
  return `${n} ${noun}${n === 1 ? '' : 's'}`;
}

/**
 * One indented row per declaration, `kind  name (SwiftName)  file`, sorted by Swift file so what
 * each file contributed reads together; within a file, source order. The Swift name appears only
 * when the TypeScript name differs from it.
 */
function listDeclarations(declarations: RenderedDeclaration[], packageDir: string): string {
  const rows = declarations
    .map((declaration, index) => ({ ...declaration, index }))
    .sort((a, b) => a.file.localeCompare(b.file) || a.index - b.index)
    .map((declaration) => ({
      kind: declaration.kind,
      name: declaration.name,
      // The Swift name, when it differs, follows the TypeScript name unstyled.
      suffix: declaration.name === declaration.swiftName ? '' : ` (${declaration.swiftName})`,
      file: path.relative(packageDir, declaration.file),
    }));
  const kindWidth = Math.max(...rows.map((row) => row.kind.length));
  const nameWidth = Math.max(...rows.map((row) => row.name.length + row.suffix.length));
  return rows
    .map((row) => {
      // Pad by the visible width; the style escapes would throw `padEnd` off.
      const padding = ' '.repeat(nameWidth - row.name.length - row.suffix.length);
      const name = `${styleTypeName(row.name)}${row.suffix}${padding}`;
      const kind = `${styleKind(row.kind)}${' '.repeat(kindWidth - row.kind.length)}`;
      return `  ${kind}  ${name}  ${styleFileName(row.file)}`;
    })
    .join('\n');
}

/**
 * Why a scan produced no declarations, from the counts the scanner reports: either no Swift file
 * at all, or files but no type exported to JavaScript.
 */
export function describeEmptyScan(stats: ScanStats, packageDir: string): string {
  if (stats.filesScanned === 0) {
    return (
      `No Swift files found in ${packageDir}. The scan skips dependency, build, test, and example ` +
      'directories, so the Swift sources of the package must live outside those.'
    );
  }
  return (
    `Scanned ${count(stats.filesScanned, 'Swift file')} in ${packageDir}, but none declares a ` +
    'native type exported to JavaScript.'
  );
}

/**
 * The heading of the warnings block, counting them and how many rendered a type as unknown or
 * skipped a declaration: `3 warnings, 2 rendered as unknown, 1 skipped:`. `null` without warnings.
 */
export function describeWarnings(warnings: RenderWarning[]): string | null {
  if (warnings.length === 0) {
    return null;
  }
  const unknown = warnings.filter((warning) =>
    warning.message.endsWith('rendered as unknown')
  ).length;
  const skipped = warnings.filter((warning) => / skipped$/.test(warning.message)).length;
  const details = [
    unknown > 0 ? `${unknown} rendered as unknown` : null,
    skipped > 0 ? `${skipped} skipped` : null,
  ].filter((detail) => detail !== null);
  return `${[count(warnings.length, 'warning'), ...details].join(', ')}:`;
}

/** The non-zero declaration counts, e.g. `1 module, 4 enums`. */
function describeCounts(counts: GenerateTypesResult['counts']): string {
  const parts = [
    count(counts.modules, 'module'),
    count(counts.sharedObjects, 'shared object'),
    count(counts.records, 'record'),
    count(counts.enums, 'enum'),
    count(counts.unions, 'union'),
  ];
  return parts.filter((part) => !part.startsWith('0 ')).join(', ');
}

/** Relative to the working directory when the file is inside it, absolute otherwise. */
function displayPath(filePath: string): string {
  const relative = path.relative(process.cwd(), filePath);
  return relative.startsWith('..') ? filePath : relative;
}

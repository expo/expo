import type { ScanStats } from 'expo-modules-macros';
import path from 'path';

import { generateTypes, type GenerateTypesWarning } from '../typegen/generateTypes';
import type { DeclarationCounts, RenderedDeclaration } from '../typegen/renderSurface';
import { parseArgs } from './args';
import { styleComment, styleFileName, styleKind, styleTypeName, styleWarning } from './styles';

const DEFAULT_OUTPUT_PATH = path.join('src', 'native.types.ts');

const HELP = `Usage: expo-modules generate-types [options] [packageDir]

Generates TypeScript types for the native API an Expo module exports to
JavaScript: its @ExpoModule, @SharedObject, @Record, and @Union types and
Enumerable enums. Scans the package directory (default: the current directory)
for Swift sources and writes them to a single TypeScript file. Doc comments
written in that file stay on the next run.

Options:
  -o, --out <path>  The TypeScript file to write, relative to the package
                    directory. Defaults to ${DEFAULT_OUTPUT_PATH}.
  --scanner <path>  Path to the Expo Modules scanner executable. Defaults to the
                    scanner of the expo-modules-macros version that
                    expo-modules-core depends on.
  --check           Verify that the file is up to date without writing it. Exits
                    with code 1 when it is not.
  -h, --help        Display this message.`;

export async function generateTypesCommand(argv: string[]) {
  const args = parseArgs(
    {
      '--out': String,
      '--scanner': String,
      '--check': Boolean,
      '--help': Boolean,
      '-o': '--out',
      '-h': '--help',
    },
    argv,
    'expo-modules generate-types'
  );
  if (args['--help']) {
    console.log(HELP);
    return;
  }
  if (args._.length > 1) {
    throw new Error(
      `\`expo-modules generate-types\` takes at most one package directory, but got ${args._.length}: ` +
        `${args._.join(', ')}. Run \`expo-modules generate-types --help\` to see the usage.`
    );
  }

  const packageDir = path.resolve(args._[0] ?? '.');
  const outputPath = path.resolve(packageDir, args['--out'] ?? DEFAULT_OUTPUT_PATH);
  const scannerPath = args['--scanner'] ? path.resolve(args['--scanner']) : undefined;

  const result = await generateTypes({
    packageDir,
    outputPath,
    scannerPath,
    check: args['--check'] ?? false,
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
      console.log(`${styleFileName(displayPath(outcome.outputPath))} is up to date: ${summary}`);
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
    console.warn(`\n${styleWarning(heading, process.stderr)}`);
    for (const warning of result.warnings) {
      // Doc comment warnings are all about the generated file, which the summary already names.
      const file =
        warning.kind === 'dropped' || warning.kind === 'changed'
          ? ''
          : `${styleFileName(path.relative(packageDir, warning.file), process.stderr)}: `;
      console.warn(
        `${styleWarning('●', process.stderr)} ${file}${styleTypeName(warning.location, process.stderr)}: ` +
          `${warning.message}.`
      );
      // A dropped comment is no longer in the file, so its text is printed for adding it back.
      if ('comment' in warning && warning.comment) {
        console.warn(styleComment(warning.comment, process.stderr));
      }
    }
  }
}

/** `1 module`, `2 modules`. */
function count(n: number, noun: string): string {
  return `${n} ${noun}${n === 1 ? '' : 's'}`;
}

/**
 * One indented row per declaration, `kind  name (NativeName)  file`, sorted by file so what each
 * file contributed reads together; within a file, source order. The native name appears only when
 * the TypeScript name differs from it.
 */
function listDeclarations(declarations: RenderedDeclaration[], packageDir: string): string {
  const rows = declarations
    .map((declaration, index) => ({ ...declaration, index }))
    .sort((a, b) => a.file.localeCompare(b.file) || a.index - b.index)
    .map((declaration) => ({
      kind: declaration.kind,
      name: declaration.name,
      // The native name, when it differs, follows the TypeScript name unstyled.
      suffix: declaration.name === declaration.nativeName ? '' : ` (${declaration.nativeName})`,
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
 * The heading of the warnings block, counting them and how many rendered a type as unknown,
 * skipped a declaration, or dropped a doc comment: `3 warnings, 2 rendered as unknown, 1 skipped:`.
 * `null` without warnings.
 */
export function describeWarnings(warnings: GenerateTypesWarning[]): string | null {
  if (warnings.length === 0) {
    return null;
  }
  const unknown = warnings.filter((warning) => warning.kind === 'unknown').length;
  const skipped = warnings.filter((warning) => warning.kind === 'skipped').length;
  const dropped = warnings.filter((warning) => warning.kind === 'dropped').length;
  const details = [
    unknown > 0 ? `${unknown} rendered as unknown` : null,
    skipped > 0 ? `${skipped} skipped` : null,
    dropped > 0 ? `${count(dropped, 'doc comment')} dropped` : null,
  ].filter((detail) => detail !== null);
  return `${[count(warnings.length, 'warning'), ...details].join(', ')}:`;
}

/** The non-zero declaration counts, e.g. `1 module, 4 enums`. */
export function describeCounts(counts: DeclarationCounts): string {
  const parts: [number, string][] = [
    [counts.modules, 'module'],
    [counts.sharedObjects, 'shared object'],
    [counts.records, 'record'],
    [counts.enums, 'enum'],
    [counts.unions, 'union'],
  ];
  return parts
    .filter(([n]) => n > 0)
    .map(([n, noun]) => count(n, noun))
    .join(', ');
}

/** Relative to the working directory when the file is inside it, absolute otherwise. */
function displayPath(filePath: string): string {
  const relative = path.relative(process.cwd(), filePath);
  return relative.startsWith('..') ? filePath : relative;
}

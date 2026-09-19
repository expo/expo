import type { Command } from 'commander';
import { styleText } from 'node:util';
import path from 'path';

import { generateTypes } from '../typegen/generateTypes';

const DEFAULT_OUTPUT_PATH = path.join('src', 'native.ts');

type GenerateTypesCommandOptions = {
  out?: string;
  scanner?: string;
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
    .action(async (packageDirArg: string | undefined, options: GenerateTypesCommandOptions) => {
      const packageDir = path.resolve(packageDirArg ?? '.');
      const outputPath = path.resolve(packageDir, options.out ?? DEFAULT_OUTPUT_PATH);
      const scannerPath = options.scanner ? path.resolve(options.scanner) : undefined;

      const result = await generateTypes({ packageDir, outputPath, scannerPath });

      for (const warning of result.warnings) {
        const file = path.relative(packageDir, warning.file);
        console.warn(
          `${styleText('yellow', 'warn')} ${file}: ${warning.location}: ${warning.message}`
        );
      }

      if (result.outputPath === null) {
        const outcome = result.removedOutputPath
          ? `Removed the previously generated ${styleText('bold', displayPath(result.removedOutputPath))}.`
          : 'Nothing was written.';
        console.log(
          `No exported native types found in ${packageDir} ` +
            `(${result.stats.filesScanned} Swift files scanned). ${outcome}`
        );
        return;
      }
      const { modules, sharedObjects, records, enums, unions } = result.counts;
      console.log(
        `Generated ${styleText('bold', displayPath(result.outputPath))}: ` +
          `${count(modules, 'module')}, ${count(sharedObjects, 'shared object')}, ` +
          `${count(records, 'record')}, ${count(enums, 'enum')}, ${count(unions, 'union')} ` +
          `from ${count(result.stats.filesParsed, 'Swift file')}.`
      );
    });
}

/** `1 module`, `2 modules`. */
function count(n: number, noun: string): string {
  return `${n} ${noun}${n === 1 ? '' : 's'}`;
}

/** Relative to the working directory when the file is inside it, absolute otherwise. */
function displayPath(filePath: string): string {
  const relative = path.relative(process.cwd(), filePath);
  return relative.startsWith('..') ? filePath : relative;
}

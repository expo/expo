import chalk from 'chalk';
import path from 'path';
import { glob } from 'tinyglobby';

import type { Command } from '../index';
import * as Log from '../log';
import { listTransformsAsync } from '../transforms';
import { parseArgsOrExit, printHelp } from '../utils/args';
import { runTransformAsync } from '../utils/runner';

const transformsBlock = (transforms: string[]): string =>
  ['', `  ${chalk.bold('Transforms available')}`, ...transforms.map((t) => `    ${t}`), ''].join(
    '\n'
  );

export type ParsedCommand = {
  transform: string;
  paths: string[];
};

/**
 * Parse argv, validate it against the available transforms, and return the
 * resolved command. Prints help and exits when --help is passed or required
 * arguments are missing.
 */
export async function parseAndValidateArgs(argv: string[] | undefined): Promise<ParsedCommand> {
  const { values, positionals } = parseArgsOrExit({
    args: argv,
    options: {
      help: { type: 'boolean', short: 'h' },
    },
    allowPositionals: true,
    strict: true,
  });

  const transforms = await listTransformsAsync();
  const [transform, ...paths] = positionals;

  if (values.help || !transform) {
    printHelp(
      'Run a codemod transform against the given paths.',
      'npx expo-codemod <transform> <paths...>',
      [
        '<transform>                   (required) name of transform to apply to files',
        '                              (see a list of transforms available below)',
        '<paths...>                    one or more paths or globs (e.g. src/**/*.tsx)',
        '-h, --help                    print this help message',
        '-v, --version                 print the CLI version',
      ].join('\n'),
      transformsBlock(transforms)
    );
  }

  if (!transforms.includes(transform)) {
    Log.exit(`Transform "${transform}" does not exist. Valid options: ${transforms.join(', ')}`);
  }

  if (paths.length === 0) {
    Log.exit(
      `No paths provided to expo-codemod. Pass one or more file paths or globs to apply the "${transform}" transform to.\n` +
        `Example: npx expo-codemod ${transform} 'src/**/*.{ts,tsx,js,jsx}'\n` +
        `Run "npx expo-codemod --help" to see all options.`
    );
  }

  return { transform, paths };
}

/**
 * Expand the given paths into a file list and dispatch them to the jscodeshift
 * runner. Files are split by extension into the `tsx` and `jsx` parser buckets.
 */
export async function resolveAndDispatch(command: ParsedCommand): Promise<void> {
  const { transform, paths } = command;
  const allFiles = await glob(paths, {
    ignore: ['**/node_modules/**'],
  });

  const tsxFiles: string[] = [];
  const tsFiles: string[] = [];
  const jsxFiles: string[] = [];
  for (const file of allFiles) {
    const ext = path.extname(file);
    if (ext === '.tsx') tsxFiles.push(file);
    else if (ext === '.ts') tsFiles.push(file);
    else if (ext === '.js' || ext === '.jsx') jsxFiles.push(file);
  }

  const mappings = {
    ts: tsFiles,
    tsx: tsxFiles,
    jsx: jsxFiles,
  } as const;

  const stats = await Promise.all(
    Object.entries(mappings)
      .filter(([_, files]) => files.length)
      .map(async ([parser, files]) => {
        Log.log(`Transforming ${files.length} ${parser.toUpperCase()} files...`);
        return await runTransformAsync({
          files,
          parser: parser as keyof typeof mappings,
          transform,
        });
      })
  );

  const combinedStats = stats.reduce(
    (acc, { error, ok, nochange, skip, timeElapsed }) => ({
      error: acc.error + error,
      ok: acc.ok + ok,
      nochange: acc.nochange + nochange,
      skip: acc.skip + skip,
      timeElapsed: Math.max(acc.timeElapsed, Number(timeElapsed)),
    }),
    { error: 0, ok: 0, nochange: 0, skip: 0, timeElapsed: 0 }
  );

  Log.log('');
  Log.log('Results:');
  Log.log(chalk.red(`  ${combinedStats.error} errors`));
  // Log.log(chalk.yellow(`  ${combinedStats.nochange} unmodified`));
  Log.log(chalk.yellow(`  ${combinedStats.skip} skipped`));
  Log.log(chalk.green(`  ${combinedStats.ok} ok`));
  Log.log(`  Time elapsed: ${combinedStats.timeElapsed.toFixed(2)}s`);
}

export const runCommand: Command = async (argv) => {
  const command = await parseAndValidateArgs(argv);
  await resolveAndDispatch(command);
};

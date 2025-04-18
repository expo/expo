import chalk from 'chalk';

import type { Command } from '../../bin/cli';
import { assertWithOptionsArgs, printHelp } from '../utils/args';

export const expoLint: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Other options are parsed manually.
      '--help': Boolean,
      '--no-cache': Boolean,
      '--fix': Boolean,
      '--quiet': Boolean,
      '--no-ignore': Boolean,

      // Aliases
      '-h': '--help',
    },
    {
      argv,
      // Allow other options, we'll throw an error if unexpected values are passed.
      permissive: true,
    }
  );

  if (args['--help']) {
    printHelp(
      chalk`Lint all files in {bold /src}, {bold /app}, {bold /components} directories with ESLint`,
      chalk`npx expo lint {dim [path...] -- [eslint options]}`,

      [
        chalk`[path...]                  List of files and directories to lint`,
        chalk`--ext {dim <string>}             Additional file extensions to lint. {dim Default: .js, .jsx, .ts, .tsx, .mjs, .cjs}`,
        chalk`--config {dim <path>}            Custom ESLint config file`,
        `--no-cache                 Check all files, instead of changes between runs`,
        `--fix                      Automatically fix problems`,
        chalk`--fix-type {dim <string>}        Specify the types of fixes to apply. {dim Example: problem, suggestion, layout}`,
        `--no-ignore                Disable use of ignore files and patterns`,
        chalk`--ignore-pattern {dim <string>}  Patterns of files to ignore`,
        `--quiet                    Only report errors`,
        chalk`--max-warnings {dim <number>}    Number of warnings to trigger nonzero exit code`,
        `-h, --help                 Usage info`,
      ].join('\n'),
      [
        '',
        chalk`  Additional options can be passed to {bold npx eslint} by using {bold --}`,
        chalk`    {dim $} npx expo lint -- --no-error-on-unmatched-pattern`,
        chalk`    {dim >} npx eslint --no-error-on-unmatched-pattern {dim ...}`,
        '',
      ].join('\n')
    );
  }

  // Load modules after the help prompt so `npx expo lint -h` shows as fast as possible.
  const { lintAsync } = require('./lintAsync') as typeof import('./lintAsync');
  const { logCmdError } = require('../utils/errors') as typeof import('../utils/errors');
  const { resolveArgsAsync } = require('./resolveOptions') as typeof import('./resolveOptions');

  const { variadic, options, extras } = await resolveArgsAsync(process.argv.slice(3)).catch(
    logCmdError
  );
  return lintAsync(variadic, options, extras).catch(logCmdError);
};

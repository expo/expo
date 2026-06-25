import { styleText } from 'node:util';

import type { Command } from '../index';
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
      `Lint all files in ${styleText('bold', `/src`)}, ${styleText('bold', `/app`)}, ${styleText('bold', `/components`)} directories with ESLint`,
      `npx expo lint ${styleText('dim', `[path...] -- [eslint options]`)}`,

      [
        `[path...]                  List of files and directories to lint`,
        `--ext ${styleText('dim', `<string>`)}             Additional file extensions to lint. ${styleText('dim', `Default: .js, .jsx, .ts, .tsx, .mjs, .cjs`)}`,
        `--config ${styleText('dim', `<path>`)}            Custom ESLint config file`,
        `--no-cache                 Check all files, instead of changes between runs`,
        `--fix                      Automatically fix problems`,
        `--fix-type ${styleText('dim', `<string>`)}        Specify the types of fixes to apply. ${styleText('dim', `Example: problem, suggestion, layout`)}`,
        `--no-ignore                Disable use of ignore files and patterns`,
        `--ignore-pattern ${styleText('dim', `<string>`)}  Patterns of files to ignore`,
        `--quiet                    Only report errors`,
        `--max-warnings ${styleText('dim', `<number>`)}    Number of warnings to trigger nonzero exit code`,
        `-h, --help                 Usage info`,
      ].join('\n'),
      [
        '',
        `  Additional options can be passed to ${styleText('bold', `npx eslint`)} by using ${styleText('bold', `--`)}`,
        `    ${styleText('dim', `$`)} npx expo lint -- --no-error-on-unmatched-pattern`,
        `    ${styleText('dim', `>`)} npx eslint --no-error-on-unmatched-pattern ${styleText('dim', `...`)}`,
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

#!/usr/bin/env node
import arg from 'arg';
import chalk from 'chalk';
import path from 'path';

import { Command } from '../../../bin/cli';
import { assertWithOptionsArgs, printHelp } from '../../utils/args';

export const expoExportEmbed: Command = async (argv) => {
  const rawArgsMap: arg.Spec = {
    // Types
    '--entry-file': String,
    '--platform': String,
    '--transformer': String,
    '--bundle-output': String,
    '--bundle-encoding': String,
    '--max-workers': Number,
    '--sourcemap-output': String,
    '--sourcemap-sources-root': String,
    '--assets-dest': String,
    '--asset-catalog-dest': String,
    '--unstable-transform-profile': String,
    '--config': String,

    // This is here for compatibility with the `npx react-native bundle` command.
    // devs should use `DEBUG=expo:*` instead.
    '--verbose': Boolean,
    '--help': Boolean,
    // Aliases
    '-h': '--help',
    '-v': '--verbose',
  };
  const args = assertWithOptionsArgs(rawArgsMap, {
    argv,
    permissive: true,
  });

  if (args['--help']) {
    printHelp(
      `(Internal) Export the JavaScript bundle during a native build script for embedding in a native binary`,
      chalk`npx expo export:embed {dim <dir>}`,
      [
        chalk`<dir>                                  Directory of the Expo project. {dim Default: Current working directory}`,
        `--entry-file <path>                    Path to the root JS file, either absolute or relative to JS root`,
        `--platform <string>                    Either "ios" or "android" (default: "ios")`,
        `--transformer <string>                 Specify a custom transformer to be used`,
        `--dev [boolean]                        If false, warnings are disabled and the bundle is minified (default: true)`,
        `--minify [boolean]                     Allows overriding whether bundle is minified. This defaults to false if dev is true, and true if dev is false. Disabling minification can be useful for speeding up production builds for testing purposes.`,
        `--bundle-output <string>               File name where to store the resulting bundle, ex. /tmp/groups.bundle`,
        `--bundle-encoding <string>             Encoding the bundle should be written in (https://nodejs.org/api/buffer.html#buffer_buffer). (default: "utf8")`,
        `--max-workers <number>                 Specifies the maximum number of workers the worker-pool will spawn for transforming files. This defaults to the number of the cores available on your machine.`,
        `--sourcemap-output <string>            File name where to store the sourcemap file for resulting bundle, ex. /tmp/groups.map`,
        `--sourcemap-sources-root <string>      Path to make sourcemap's sources entries relative to, ex. /root/dir`,
        `--sourcemap-use-absolute-path          Report SourceMapURL using its full path`,
        `--assets-dest <string>                 Directory name where to store assets referenced in the bundle`,
        `--asset-catalog-dest <string>          Directory to create an iOS Asset Catalog for images`,
        `--unstable-transform-profile <string>  Experimental, transform JS for a specific JS engine. Currently supported: hermes, hermes-canary, default`,
        `--reset-cache                          Removes cached files`,
        `-v, --verbose                          Enables debug logging`,

        `--config <string>                      Path to the CLI configuration file`,
        // This is seemingly unused.
        `--read-global-cache                    Try to fetch transformed JS code from the global cache, if configured.`,

        `-h, --help                             Usage info`,
      ].join('\n')
    );
  }

  const [
    { exportEmbedAsync },
    { resolveOptions },
    { logCmdError },
    { resolveCustomBooleanArgsAsync },
  ] = await Promise.all([
    import('./exportEmbedAsync.js'),
    import('./resolveOptions.js'),
    import('../../utils/errors.js'),
    import('../../utils/resolveArgs.js'),
  ]);

  return (async () => {
    const parsed = await resolveCustomBooleanArgsAsync(argv ?? [], rawArgsMap, {
      '--dev': Boolean,
      '--minify': Boolean,
      '--sourcemap-use-absolute-path': Boolean,
      '--reset-cache': Boolean,
      '--read-global-cache': Boolean,
    });
    return exportEmbedAsync(path.resolve(parsed.projectRoot), resolveOptions(args, parsed));
  })().catch(logCmdError);
};

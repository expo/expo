#!/usr/bin/env node
import arg from 'arg';
import chalk from 'chalk';
import path from 'path';

import { Command } from '../../bin/cli';
import { assertWithOptionsArgs, printHelp } from '../utils/args';

export const expoBundleProxy: Command = async (argv) => {
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
    '--unstable-transform-profile': String,
    '--config': String,

    '--help': Boolean,
    // Aliases
    '-h': '--help',
  };
  const args = assertWithOptionsArgs(rawArgsMap, {
    argv,
    permissive: true,
  });

  if (args['--help']) {
    printHelp(
      `Export the JavaScript bundle during a native build script for embedding in a native binary`,
      chalk`npx expo bundle:proxy {dim <dir>}`,
      [
        chalk`<dir>                                    Directory of the Expo project. {dim Default: Current working directory}`,
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
        `--unstable-transform-profile <string>  Experimental, transform JS for a specific JS engine. Currently supported: hermes, hermes-canary, default`,
        `--reset-cache                          Removes cached files`,

        `--config <string>                      Path to the CLI configuration file`,
        `--generate-static-view-configs         Generate static view configs for Fabric components. If there are no Fabric components in the bundle or Fabric is disabled, this is just no-op.`,
        // This is seemingly unused.
        `--read-global-cache                    Try to fetch transformed JS code from the global cache, if configured.`,

        `-h, --help                             Usage info`,
      ].join('\n')
    );
  }

  const [
    { bundleProxyAsync },
    { resolveOptions },
    // ../utils/errors
    { logCmdError },
  ] = await Promise.all([
    import('./bundleProxyAsync'),
    import('./resolveOptions'),
    import('../utils/errors'),
  ]);

  const { resolveCustomBooleanArgsAsync } = await import('../utils/resolveArgs');

  return (async () => {
    const parsed = await resolveCustomBooleanArgsAsync(argv ?? [], rawArgsMap, {
      '--dev': Boolean,
      '--minify': Boolean,
      '--sourcemap-use-absolute-path': Boolean,
      '--reset-cache': Boolean,
      '--read-global-cache': Boolean,
      '--generate-static-view-configs': Boolean,
    });
    return bundleProxyAsync(path.resolve(parsed.projectRoot), resolveOptions(args, parsed));
  })().catch(logCmdError);
};

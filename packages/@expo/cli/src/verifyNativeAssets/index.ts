#!/usr/bin/env node
import arg from 'arg';
import chalk from 'chalk';

import { getMissingAssets } from './verifyNativeAssets';
import { Command } from '../../bin/cli';
import { getProjectRoot, assertWithOptionsArgs, printHelp } from '../utils/args';

const debug = require('debug')('expo:verify-native-assets') as typeof console.log;

export const expoVerifyNativeAssets: Command = async (argv) => {
  const rawArgsMap: arg.Spec = {
    // Types
    '--export-path': String,
    '--build-path': String,
    '--platform': String,
    '--help': Boolean,
    // Aliases
    '-h': '--help',
    '-p': '--platform',
  };
  const args = assertWithOptionsArgs(rawArgsMap, {
    argv,
    permissive: true,
  });

  const [{ resolveOptions, defaultOptions }, { logCmdError }] = await Promise.all([
    import('./resolveOptions.js'),
    import('../utils/errors.js'),
  ]);

  if (args['--help']) {
    printHelp(
      `(Internal) Verify that all static files in an exported bundle are in either the export or an embedded bundle`,
      chalk`npx expo verifyNativeAssets {dim <dir>}`,
      [
        chalk`<dir>                                  Directory of the Expo project. {dim Default: Current working directory}`,
        chalk`--export-path <path>                   Path to the exported bundle {dim Default: ${defaultOptions.exportPath}}`,
        chalk`--build-path <path>                    Path to a build containing an embedded manifest {dim Default: ${defaultOptions.buildPath}}`,
        chalk`-p, --platform <platform>              Options: android, ios {dim Default: ${defaultOptions.platform}}`,
        `-h, --help                             Usage info`,
      ].join('\n')
    );
  }

  return (async () => {
    const projectRoot = getProjectRoot(args);

    const validatedArgs = resolveOptions(projectRoot, args);
    debug(`Validated params: ${JSON.stringify(validatedArgs, null, 2)}`);

    const { buildPath, exportPath, platform } = validatedArgs;

    const missingAssets = getMissingAssets(buildPath, exportPath, platform, projectRoot);

    if (missingAssets.length > 0) {
      console.warn(
        `${missingAssets.length} assets not found in either embedded manifest or in exported bundle`
      );
    } else {
      console.warn(`All resolved assets found in either embedded manifest or in exported bundle.`);
    }
    process.exit(0);
  })().catch(logCmdError);
};

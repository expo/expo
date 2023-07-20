#!/usr/bin/env node
import { getConfig } from '@expo/config';
import chalk from 'chalk';

import { Command } from '../../bin/cli';
import { Log } from '../log';
import { TypeScriptProjectPrerequisite } from '../start/doctor/typescript/TypeScriptProjectPrerequisite';
import { MetroBundlerDevServer } from '../start/server/metro/MetroBundlerDevServer';
import { getPlatformBundlers } from '../start/server/platformBundlers';
import { assertArgs, printHelp, getProjectRoot } from '../utils/args';

export const expoTypescript: Command = async (argv) => {
  const args = assertArgs(
    {
      // Types
      '--help': Boolean,
      // Aliases
      '-h': '--help',
    },
    argv
  );

  if (args['--help']) {
    printHelp(
      `Automatically setup Typescript and generate types for Expo packages`,
      `npx expo typescript`,
      [`-h, --help               Usage info`].join('\n')
    );
  }

  const projectRoot = getProjectRoot(args);
  const { exp } = getConfig(projectRoot, { skipSDKVersionRequirement: true });

  try {
    const req = new TypeScriptProjectPrerequisite(projectRoot);
    await req.bootstrapAsync();
  } catch (error: any) {
    // Ensure the process doesn't fail if the TypeScript check fails.
    // This could happen during the install.
    Log.log();
    Log.error(
      chalk.red`Failed to automatically setup TypeScript for your project. Try restarting the dev server to fix.`
    );
    Log.exception(error);
  }

  await new MetroBundlerDevServer(
    getProjectRoot(args),
    getPlatformBundlers(exp),
    true
  ).startTypeScriptServices();
};

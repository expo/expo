#!/usr/bin/env node
import { getConfig } from '@expo/config';

import { Command } from '../../bin/cli';
import { Log } from '../log';
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

  const { TypeScriptProjectPrerequisite } = await import(
    '../start/doctor/typescript/TypeScriptProjectPrerequisite'
  );
  const { MetroBundlerDevServer } = await import('../start/server/metro/MetroBundlerDevServer');
  const { getPlatformBundlers } = await import('../start/server/platformBundlers');

  try {
    await new TypeScriptProjectPrerequisite(projectRoot).bootstrapAsync();
  } catch (error: any) {
    // Ensure the process doesn't fail if the TypeScript check fails.
    // This could happen during the install.
    Log.log();
    Log.exception(error);
    return;
  }

  const { exp } = getConfig(projectRoot, { skipSDKVersionRequirement: true });
  await new MetroBundlerDevServer(
    getProjectRoot(args),
    getPlatformBundlers(exp),
    true
  ).startTypeScriptServices();
};

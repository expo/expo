#!/usr/bin/env node
import arg from 'arg';
import chalk from 'chalk';
import type { ModPlatform } from 'expo/config-plugins';
import { existsSync } from 'fs';
import path from 'path';

import * as logger from './logger';
import { patchProjectAsync } from './patchProjectAsync';

(async () => {
  const args = arg({
    // Types
    '--help': Boolean,
    '--clean': Boolean,
    '--template': String,
    '--platform': String,
    // Aliases
    '-h': '--help',
    '-p': '--platform',
  });

  if (args['--help']) {
    printHelp(
      `(Experimental) Generate patch files for iOS and Android native projects to persist changes made manually after prebuild`,
      chalk`npx patch-project {dim <dir>}`,
      [
        chalk`<dir>                                    Directory of the Expo project. {dim Default: Current working directory}`,
        `--clean                                  Delete the native folders after the conversion`,
        `--template <template>                    Project template to clone from. File path pointing to a local tar file or a github repo`,
        chalk`-p, --platform <all|android|ios>         Platforms to sync: ios, android, all. {dim Default: all}`,
        `-h, --help                               Usage info`,
      ].join('\n')
    );
  }

  const projectRoot = path.resolve(args._[0] || '.');

  if (!existsSync(projectRoot)) {
    logger.exit(`Invalid project root: ${projectRoot}`);
  }

  try {
    await patchProjectAsync(projectRoot, {
      // Parsed options
      clean: !!args['--clean'],
      platforms: resolvePlatformOption(args['--platform']),
      template: args['--template'],
    });
  } catch (e: unknown) {
    if (e instanceof Error || typeof e === 'string') {
      logger.exit(e);
    }
    throw e;
  }
})();

// Install exit hooks
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

function printHelp(info: string, usage: string, options: string, extra: string = ''): never {
  logger.exit(
    chalk`
  {bold Info}
    ${info}

  {bold Usage}
    {dim $} ${usage}

  {bold Options}
    ${options.split('\n').join('\n    ')}
` + extra,
    0
  );
}

function resolvePlatformOption(
  platform: string = 'all',
  { loose }: { loose?: boolean } = {}
): ModPlatform[] {
  switch (platform) {
    case 'ios':
      return ['ios'];
    case 'android':
      return ['android'];
    case 'all':
      return loose || process.platform !== 'win32' ? ['android', 'ios'] : ['android'];
    default:
      return [platform as ModPlatform];
  }
}

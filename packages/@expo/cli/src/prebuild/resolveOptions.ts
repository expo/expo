import { ModPlatform } from '@expo/config-plugins';
import assert from 'assert';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

import * as Log from '../log';
import { CommandError } from '../utils/errors';
import { validateUrl } from '../utils/url';

export function resolvePackageManagerOptions(args: any) {
  const managers: Record<string, boolean> = {
    npm: args['--npm'],
    yarn: args['--yarn'],
    pnpm: args['--pnpm'],
    bun: args['--bun'],
  };

  if (
    [managers.npm, managers.pnpm, managers.yarn, managers.bun, !!args['--no-install']].filter(
      Boolean
    ).length > 1
  ) {
    throw new CommandError(
      'BAD_ARGS',
      'Specify at most one of: --no-install, --npm, --pnpm, --yarn, --bun'
    );
  }

  return managers;
}

/** Resolves a template option as a URL or file path pointing to a tar file. */
export function resolveTemplateOption(template: string) {
  if (validateUrl(template)) {
    return template;
  }
  const templatePath = path.resolve(template);
  assert(fs.existsSync(templatePath), 'template file does not exist: ' + templatePath);
  assert(
    fs.statSync(templatePath).isFile(),
    'template must be a tar file created by running `npm pack` in a project: ' + templatePath
  );

  return templatePath;
}

/** Resolves dependencies to skip from a string joined by `,`. Example: `react-native,expo,lodash` */
export function resolveSkipDependencyUpdate(value: any) {
  if (!value || typeof value !== 'string') {
    return [];
  }
  return value.split(',');
}

/** Returns an array of platforms based on the input platform identifier and runtime constraints. */
export function resolvePlatformOption(
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

/** Warns and filters out unsupported platforms based on the runtime constraints. Essentially this means no iOS on Windows devices. */
export function ensureValidPlatforms(platforms: ModPlatform[]): ModPlatform[] {
  // Skip prebuild for iOS on Windows
  if (process.platform === 'win32' && platforms.includes('ios')) {
    Log.warn(
      chalk`⚠️  Skipping generating the iOS native project files. Run {bold npx expo prebuild} again from macOS or Linux to generate the iOS project.\n`
    );
    return platforms.filter((platform) => platform !== 'ios');
  }
  return platforms;
}

/** Asserts platform length must be greater than zero. */
export function assertPlatforms(platforms: ModPlatform[]) {
  if (!platforms?.length) {
    throw new CommandError('At least one platform must be enabled when syncing');
  }
}

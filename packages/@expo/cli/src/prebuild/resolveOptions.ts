import { ModPlatform } from '@expo/config-plugins';
import assert from 'assert';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

import * as Log from '../log';
import { CommandError } from '../utils/errors';
import { validateUrl } from '../utils/url';

const debug = require('debug')('expo:prebuild:resolveOptions') as typeof console.log;

export interface ResolvedTemplateOption {
  type: 'file' | 'npm' | 'repository';
  uri: string;
}

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
export function resolveTemplateOption(template: string): ResolvedTemplateOption {
  assert(template, 'template is required');

  if (template.startsWith('https://') || template.startsWith('http://')) {
    if (!validateUrl(template)) {
      throw new CommandError('BAD_ARGS', 'Invalid URL provided as a template');
    }
    debug('Resolved template to repository path:', template);
    return { type: 'repository', uri: template };
  }

  if (
    // Supports `file:./path/to/template.tgz`
    template.startsWith('file:') ||
    // Supports `../path/to/template.tgz`
    template.startsWith('.') ||
    // Supports `\\path\\to\\template.tgz`
    template.startsWith(path.sep)
  ) {
    let resolvedUri = template;
    if (resolvedUri.startsWith('file:')) {
      resolvedUri = resolvedUri.substring(5);
    }
    const templatePath = path.resolve(resolvedUri);
    assert(fs.existsSync(templatePath), 'template file does not exist: ' + templatePath);
    assert(
      fs.statSync(templatePath).isFile(),
      'template must be a tar file created by running `npm pack` in a project: ' + templatePath
    );

    debug(`Resolved template to file path:`, templatePath);
    return { type: 'file', uri: templatePath };
  }

  if (fs.existsSync(template)) {
    // Backward compatible with the old local template argument, e.g. `--template dir/template.tgz`
    const templatePath = path.resolve(template);
    debug(`Resolved template to file path:`, templatePath);
    return { type: 'file', uri: templatePath };
  }

  debug(`Resolved template to NPM package:`, template);
  return { type: 'npm', uri: template };
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

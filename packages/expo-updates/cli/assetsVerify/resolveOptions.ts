import arg from 'arg';
import path from 'path';

import { isValidPlatform, validPlatforms, type ValidatedOptions } from './types';

export const defaultOptions = {
  exportPath: './dist',
  buildPath: '.',
};

export function resolveOptions(projectRoot: string, args: arg.Result<arg.Spec>): ValidatedOptions {
  if (!isValidPlatform(args['--platform'])) {
    throw new Error(`Platform must be one of ${JSON.stringify(validPlatforms)}`);
  }
  return {
    exportPath: path.resolve(projectRoot, args['--export-path'] ?? defaultOptions.exportPath),
    buildPath: path.resolve(projectRoot, args['--build-path'] ?? defaultOptions.buildPath),
    platform: args['--platform'] ?? 'ios',
  };
}

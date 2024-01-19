import arg from 'arg';
import path from 'path';

import { ValidatedOptions } from './types';

export const defaultOptions = {
  exportPath: './dist',
  buildPath: '.',
  platform: 'ios',
};

export function resolveOptions(projectRoot: string, args: arg.Result<arg.Spec>): ValidatedOptions {
  return {
    exportPath: path.resolve(projectRoot, args['--export-path'] ?? defaultOptions.exportPath),
    buildPath: path.resolve(projectRoot, args['--build-path'] ?? defaultOptions.buildPath),
    platform: args['--platform'] ?? 'ios',
  };
}

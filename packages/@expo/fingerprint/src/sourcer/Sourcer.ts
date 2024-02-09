import chalk from 'chalk';

import {
  getBareAndroidSourcesAsync,
  getBareIosSourcesAsync,
  getPackageJsonScriptSourcesAsync,
  getGitIgnoreSourcesAsync,
  getRncliAutolinkingSourcesAsync,
} from './Bare';
import {
  getEasBuildSourcesAsync,
  getExpoAutolinkingAndroidSourcesAsync,
  getExpoAutolinkingIosSourcesAsync,
  getExpoConfigSourcesAsync,
} from './Expo';
import { getPatchPackageSourcesAsync } from './PatchPackage';
import type { HashSource, NormalizedOptions } from '../Fingerprint.types';
import { profile } from '../utils/Profile';

const debug = require('debug')('expo:fingerprint:sourcer:Sourcer');

export async function getHashSourcesAsync(
  projectRoot: string,
  options: NormalizedOptions
): Promise<HashSource[]> {
  const results = await Promise.all([
    // expo
    profile(getExpoAutolinkingAndroidSourcesAsync)(projectRoot, options),
    profile(getExpoAutolinkingIosSourcesAsync)(projectRoot, options),
    profile(getExpoConfigSourcesAsync)(projectRoot, options),
    profile(getEasBuildSourcesAsync)(projectRoot, options),

    // bare managed files
    profile(getGitIgnoreSourcesAsync)(projectRoot, options),
    profile(getPackageJsonScriptSourcesAsync)(projectRoot, options),

    // bare native files
    profile(getBareAndroidSourcesAsync)(projectRoot, options),
    profile(getBareIosSourcesAsync)(projectRoot, options),

    // rn-cli autolinking
    profile(getRncliAutolinkingSourcesAsync)(projectRoot, options),

    // patch-package
    profile(getPatchPackageSourcesAsync)(projectRoot, options),
  ]);

  // extra sources
  if (options.extraSources) {
    for (const source of options.extraSources) {
      debug(`Adding extra source - ${chalk.dim(JSON.stringify(source))}`);
    }
    results.push(options.extraSources);
  }

  // flatten results
  return ([] as HashSource[]).concat(...results);
}

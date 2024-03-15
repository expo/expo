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
  getExpoCNGPatchSourcesAsync,
} from './Expo';
import { getDefaultPackageSourcesAsync } from './Packages';
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
    profile(options, getExpoAutolinkingAndroidSourcesAsync)(projectRoot, options),
    profile(options, getExpoAutolinkingIosSourcesAsync)(projectRoot, options),
    profile(options, getExpoConfigSourcesAsync)(projectRoot, options),
    profile(options, getEasBuildSourcesAsync)(projectRoot, options),
    profile(options, getExpoCNGPatchSourcesAsync)(projectRoot, options),

    // bare managed files
    profile(options, getGitIgnoreSourcesAsync)(projectRoot, options),
    profile(options, getPackageJsonScriptSourcesAsync)(projectRoot, options),

    // bare native files
    profile(options, getBareAndroidSourcesAsync)(projectRoot, options),
    profile(options, getBareIosSourcesAsync)(projectRoot, options),

    // rn-cli autolinking
    profile(options, getRncliAutolinkingSourcesAsync)(projectRoot, options),

    // patch-package
    profile(options, getPatchPackageSourcesAsync)(projectRoot, options),

    // some known dependencies, e.g. react-native
    profile(options, getDefaultPackageSourcesAsync)(projectRoot, options),
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

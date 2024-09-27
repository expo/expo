import chalk from 'chalk';
import semver from 'semver';

import {
  getBareAndroidSourcesAsync,
  getBareIosSourcesAsync,
  getPackageJsonScriptSourcesAsync,
  getGitIgnoreSourcesAsync,
  getCoreAutolinkingSourcesFromRncCliAsync,
  getCoreAutolinkingSourcesFromExpoAndroid,
  getCoreAutolinkingSourcesFromExpoIos,
} from './Bare';
import {
  getEasBuildSourcesAsync,
  getExpoAutolinkingAndroidSourcesAsync,
  getExpoAutolinkingIosSourcesAsync,
  getExpoConfigSourcesAsync,
  getExpoCNGPatchSourcesAsync,
} from './Expo';
import { resolveExpoAutolinkingVersion } from '../ExpoVersions';
import { getDefaultPackageSourcesAsync } from './Packages';
import { getPatchPackageSourcesAsync } from './PatchPackage';
import type { HashSource, NormalizedOptions } from '../Fingerprint.types';
import { profile } from '../utils/Profile';

const debug = require('debug')('expo:fingerprint:sourcer:Sourcer');

export async function getHashSourcesAsync(
  projectRoot: string,
  options: NormalizedOptions
): Promise<HashSource[]> {
  const expoAutolinkingVersion = resolveExpoAutolinkingVersion(projectRoot) ?? '0.0.0';
  const useRNCoreAutolinkingFromExpo =
    // expo-modules-autolinking supports the `react-native-config` core autolinking from 1.11.2.
    // To makes the `useRNCoreAutolinkingFromExpo` default to `true` for Expo SDK 52 and higher.
    // We check the expo-modules-autolinking version from 1.12.0.
    typeof options.useRNCoreAutolinkingFromExpo === 'boolean'
      ? options.useRNCoreAutolinkingFromExpo
      : semver.gte(expoAutolinkingVersion, '1.12.0');

  const results = await Promise.all([
    // expo
    profile(options, getExpoAutolinkingAndroidSourcesAsync)(
      projectRoot,
      options,
      expoAutolinkingVersion
    ),
    profile(options, getExpoAutolinkingIosSourcesAsync)(
      projectRoot,
      options,
      expoAutolinkingVersion
    ),
    profile(options, getExpoConfigSourcesAsync)(projectRoot, options),
    profile(options, getEasBuildSourcesAsync)(projectRoot, options),
    profile(options, getExpoCNGPatchSourcesAsync)(projectRoot, options),

    // bare managed files
    profile(options, getGitIgnoreSourcesAsync)(projectRoot, options),
    profile(options, getPackageJsonScriptSourcesAsync)(projectRoot, options),

    // bare native files
    profile(options, getBareAndroidSourcesAsync)(projectRoot, options),
    profile(options, getBareIosSourcesAsync)(projectRoot, options),

    // react-native core autolinking
    profile(options, getCoreAutolinkingSourcesFromExpoAndroid)(
      projectRoot,
      options,
      useRNCoreAutolinkingFromExpo
    ),
    profile(options, getCoreAutolinkingSourcesFromExpoIos)(
      projectRoot,
      options,
      useRNCoreAutolinkingFromExpo
    ),
    profile(options, getCoreAutolinkingSourcesFromRncCliAsync)(
      projectRoot,
      options,
      useRNCoreAutolinkingFromExpo
    ),

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

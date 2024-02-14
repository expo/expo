#!/usr/bin/env node
import arg from 'arg';
import chalk from 'chalk';
import path from 'path';

import { getMissingAssetsAsync } from './assetsVerifyAsync';
import {
  isValidPlatform,
  validPlatforms,
  type ValidatedOptions,
  type Platform,
} from './assetsVerifyTypes';
import { Command } from './cli';
import { assertArgs, getProjectRoot } from './utils/args';
import * as Log from './utils/log';

const debug = require('debug')('expo-updates:assets:verify') as typeof console.log;

export const expoAssetsVerify: Command = async (argv) => {
  const args = assertArgs(
    {
      // Types
      '--asset-map-path': String,
      '--exported-manifest-path': String,
      '--build-manifest-path': String,
      '--platform': String,
      '--help': Boolean,
      // Aliases
      '-a': '--asset-map-path',
      '-e': '--exported-manifest-path',
      '-b': '--build-manifest-path',
      '-p': '--platform',
      '-h': '--help',
    },
    argv ?? []
  );

  if (args['--help']) {
    Log.exit(
      chalk`
{bold Description}
Verify that all static files in an exported bundle are in either the export or an embedded bundle

{bold Usage}
  {dim $} npx expo-updates assets:verify {dim <dir>}

  Options
  <dir>                                  Directory of the Expo project. Default: Current working directory
  -a, --asset-map-path <path>            Path to the \`assetmap.json\` in an export produced by the command \`npx expo export --dump-assetmap\`
  -e, --exported-manifest-path <path>    Path to the \`metadata.json\` in an export produced by the command \`npx expo export --dump-assetmap\`
  -b, --build-manifest-path <path>       Path to the \`app.manifest\` file created by expo-updates in an Expo application build (either ios or android)
  -p, --platform <platform>              Options: ${JSON.stringify(validPlatforms)}
  -h, --help                             Usage info
  `,
      0
    );
  }

  return (async () => {
    const projectRoot = getProjectRoot(args);

    const validatedArgs = resolveOptions(projectRoot, args);
    debug(`Validated params: ${JSON.stringify(validatedArgs, null, 2)}`);

    const { buildManifestPath, exportedManifestPath, assetMapPath, platform } = validatedArgs;

    const missingAssets = await getMissingAssetsAsync(
      buildManifestPath,
      exportedManifestPath,
      assetMapPath,
      platform
    );

    if (missingAssets.length > 0) {
      throw new Error(
        `${
          missingAssets.length
        } assets not found in either embedded manifest or in exported bundle:${JSON.stringify(
          missingAssets,
          null,
          2
        )}`
      );
    } else {
      Log.log(`All resolved assets found in either embedded manifest or in exported bundle.`);
    }
    process.exit(0);
  })().catch((e) => {
    Log.log(`${e}`);
    process.exit(1);
  });
};

function resolveOptions(projectRoot: string, args: arg.Result<arg.Spec>): ValidatedOptions {
  const exportedManifestPath = validatedPathFromArgument(
    projectRoot,
    args,
    '--exported-manifest-path'
  );
  const buildManifestPath = validatedPathFromArgument(projectRoot, args, '--build-manifest-path');
  const assetMapPath = validatedPathFromArgument(projectRoot, args, '--asset-map-path');

  const platform = args['--platform'] as unknown as Platform;
  if (!isValidPlatform(platform)) {
    throw new Error(`Platform must be one of ${JSON.stringify(validPlatforms)}`);
  }

  return {
    exportedManifestPath,
    buildManifestPath,
    assetMapPath,
    platform,
  };
}

function validatedPathFromArgument(projectRoot: string, args: arg.Result<arg.Spec>, key: string) {
  const maybeRelativePath = args[key] as unknown as string;
  if (!maybeRelativePath) {
    throw new Error(`No value for ${key}`);
  }
  if (maybeRelativePath.indexOf('/') === 0) {
    return maybeRelativePath; // absolute path
  }
  return path.resolve(projectRoot, maybeRelativePath);
}

#!/usr/bin/env node
import chalk from 'chalk';

import { getMissingAssets } from './assetsVerify';
import { resolveOptions, defaultOptions } from './resolveOptions';
import { validPlatforms } from './types';
import { Command } from '../cli';
import { assertArgs, getProjectRoot } from '../utils/args';
import * as Log from '../utils/log';

export const expoAssetsVerify: Command = async (argv) => {
  const args = assertArgs(
    {
      // Types
      '--export-path': String,
      '--build-path': String,
      '--platform': String,
      '--help': Boolean,
      // Aliases
      '-h': '--help',
      '-p': '--platform',
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
  --export-path <path>                   Path to the exported bundle Default: ./dist
  --build-path <path>                    Path to a build containing an embedded manifest Default: .
  -p, --platform <platform>              Options: ["android","ios"]
  -h, --help                             Usage info
  `,
      0
    );
  }

  return (async () => {
    const projectRoot = getProjectRoot(args);

    const validatedArgs = resolveOptions(projectRoot, args);
    Log.log(`Validated params: ${JSON.stringify(validatedArgs, null, 2)}`);

    const { buildPath, exportPath, platform } = validatedArgs;

    const missingAssets = await getMissingAssets(buildPath, exportPath, platform, projectRoot);

    if (missingAssets.length > 0) {
      throw new Error(
        `${
          missingAssets.length
        } assets not found in either embedded manifest or in exported bundle:${JSON.stringify(
          missingAssets.map((asset) => ({
            hash: asset.hash,
            path: asset.files?.length ? asset.files[0] : '',
          })),
          null,
          2
        )}`
      );
    } else {
      Log.warn(`All resolved assets found in either embedded manifest or in exported bundle.`);
    }
    process.exit(0);
  })().catch((e) => {
    Log.log(`${e}`);
    process.exit(1);
  });
};

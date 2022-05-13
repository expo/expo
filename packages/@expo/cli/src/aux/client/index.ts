#!/usr/bin/env node
import arg from 'arg';
import chalk from 'chalk';
import path from 'path';

import { Command } from '../../../bin/cli';
import { assertWithOptionsArgs, printHelp } from '../../utils/args';
import { logCmdError } from '../../utils/errors';

export const expoAuxClient: Command = async (argv) => {
  const rawArgsMap: arg.Spec = {
    // Types
    '--help': Boolean,
    '--sdk-version': String,
    '--platform': String,

    // Aliases
    '-p': '--platform',
    '-h': '--help',
  };
  const args = assertWithOptionsArgs(rawArgsMap, {
    argv,
    permissive: true,
  });

  if (args['--help']) {
    printHelp(
      `Install the Expo Go app on a device`,
      `npx expo run:ios`,
      [
        chalk`-p, --platform <platform>     Platform to install on: android, ios`,
        chalk`--sdk-version <string>        Expo Go SDK version to install on device. {dim Default: installed {bold expo} version}`,
        `-d, --device [device]         Device name or ID to build the app on`,

        `-h, --help                    Usage info`,
      ].join('\n')
    );
  }

  (async () => {
    const { resolveStringOrBooleanArgsAsync } = await import('../../utils/resolveArgs');
    const parsed = await resolveStringOrBooleanArgsAsync(argv ?? [], rawArgsMap, {
      '--device': Boolean,
      '-d': '--device',
    }).catch(logCmdError);

    const { resolveOptionsAsync } = await import('./resolveOptions');
    const { clientAsync } = await import('./clientAsync');
    const projectRoot = path.resolve(parsed.projectRoot);

    const options = await resolveOptionsAsync(projectRoot, {
      ...args,
      ...parsed.args,
    });

    return clientAsync(projectRoot, options);
  })().catch(logCmdError);
};

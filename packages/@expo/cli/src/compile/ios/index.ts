#!/usr/bin/env node
import type { Command } from '../../index';
import * as Log from '../../log';
import { assertArgs, printHelp } from '../../utils/args';

export const expoCompileIos: Command = async (argv) => {
  const args = assertArgs(
    {
      '--help': Boolean,
      '-h': '--help',
    },
    argv
  );

  if (args['--help']) {
    printHelp(
      `Build the iOS app binary locally`,
      `npx expo compile:ios`,
      `-h, --help    Usage info`
    );
  }

  Log.exit(`expo compile:ios is not available yet.`);
};

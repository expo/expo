#!/usr/bin/env node
import type { Command } from '../../index';
import * as Log from '../../log';
import { assertArgs, printHelp } from '../../utils/args';

export const expoCompileAndroid: Command = async (argv) => {
  const args = assertArgs(
    {
      '--help': Boolean,
      '-h': '--help',
    },
    argv
  );

  if (args['--help']) {
    printHelp(
      `Build the Android app binary locally`,
      `npx expo compile:android`,
      `-h, --help    Usage info`
    );
  }

  Log.exit(`expo compile:android is not available yet.`);
};

#!/usr/bin/env node
import chalk from 'chalk';

import type { Command } from '../../index';
import { getProjectRoot, printHelp } from '../../utils/args';
import { logCmdError } from '../../utils/errors';
import { parseCompileArgs } from '../args';

export const expoCompileIos: Command = async (argv) => {
  return (async () => {
    const { values, positionals } = parseCompileArgs(argv);

    if (values.help) {
      printHelp(
        `Build the iOS app binary locally`,
        chalk`npx expo compile:ios {dim <dir>}`,
        [
          chalk`<dir>                    Directory of the Expo project. {dim Default: Current working directory}`,
          `--dev                    Build in development mode`,
          `--prod                   Build in production mode (default)`,
          `--device <device>        Device name or ID to build the app for`,
          `--output-dir <dir>       Directory to copy the built app to`,
          `--output-type <app|ipa>  Type of app binary to build`,
          `-h, --help               Usage info`,
        ].join('\n'),
        [
          '',
          chalk`  Build the app in development mode:`,
          chalk`    {dim $} npx expo compile:ios --dev`,
          '',
          chalk`  Copy the built app into a folder in your project:`,
          chalk`    {dim $} npx expo compile:ios --dev --output-dir ./build`,
          '',
        ].join('\n')
      );
    }

    const projectRoot = getProjectRoot({ _: positionals });
    const { resolveMode } = await import('../resolveMode.js');
    const mode = resolveMode({
      dev: values.dev,
      prod: values.prod,
      device: values.device,
    });
    const { loadEnvFiles } = await import('../../utils/nodeEnv.js');
    loadEnvFiles(projectRoot, { mode });

    const { resolveOptions } = await import('../resolveOptions.js');
    const options = resolveOptions(projectRoot, {
      platform: 'ios',
      mode,
      device: values.device,
      outputDir: values['output-dir'],
      outputType: values['output-type'],
    });

    const { compileIosAsync } = await import('./compileIosAsync.js');
    return compileIosAsync(projectRoot, options);
  })().catch(logCmdError);
};

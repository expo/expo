#!/usr/bin/env node
import chalk from 'chalk';

import type { Command } from '../../index';
import { getProjectRoot, printHelp } from '../../utils/args';
import { logCmdError } from '../../utils/errors';
import { parseCompileArgs } from '../args';

export const expoCompileAndroid: Command = async (argv) => {
  return (async () => {
    const { values, positionals } = parseCompileArgs(argv);

    if (values.help) {
      printHelp(
        `Build the Android app binary locally`,
        chalk`npx expo compile:android {dim <dir>}`,
        [
          chalk`<dir>                    Directory of the Expo project. {dim Default: Current working directory}`,
          `--dev                    Build in development mode`,
          `--prod                   Build in production mode (default)`,
          `--device <device>        Device name or ID to build the app for`,
          `--output-dir <dir>       Directory to copy the built app to`,
          `--output-type <apk|aab>  Type of app binary to build`,
          `-h, --help               Usage info`,
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
      platform: 'android',
      mode,
      device: values.device,
      outputDir: values['output-dir'],
      outputType: values['output-type'],
    });

    const { compileAndroidAsync } = await import('./compileAndroidAsync.js');
    return compileAndroidAsync(projectRoot, options);
  })().catch(logCmdError);
};

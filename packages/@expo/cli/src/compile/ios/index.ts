#!/usr/bin/env node
import type { Command } from '../../index';
import * as Log from '../../log';
import { getProjectRoot } from '../../utils/args';
import { logCmdError } from '../../utils/errors';
import { parseCompileArgs } from '../args';
import { getHelp } from './help';

export const expoCompileIos: Command = async (argv) => {
  try {
    const { values, positionals } = parseCompileArgs(argv);

    if (values.help) {
      Log.log(getHelp());
      return;
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
    await compileIosAsync(projectRoot, options);
  } catch (error) {
    return logCmdError(error);
  }
};

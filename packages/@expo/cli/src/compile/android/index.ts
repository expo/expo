import type { Command } from '../../index';
import * as Log from '../../log';
import { logCmdError } from '../../utils/errors';
import { findUpProjectRootOrAssert } from '../../utils/findUp';
import { parseCompileArgs } from '../args';
import { getHelp } from './help';

export const expoCompileAndroid: Command = async (argv) => {
  try {
    const { values } = parseCompileArgs(argv);

    if (values.help) {
      Log.log(getHelp());
      return;
    }

    const projectRoot = findUpProjectRootOrAssert(process.cwd());
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
    await compileAndroidAsync(projectRoot, options);
  } catch (error) {
    return logCmdError(error);
  }
};

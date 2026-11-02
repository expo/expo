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

    const { resolveOptions } = await import('../resolveOptions.js');
    const options = resolveOptions('android', values);

    const projectRoot = findUpProjectRootOrAssert(process.cwd());
    const { loadEnvFiles } = await import('../../utils/nodeEnv.js');
    loadEnvFiles(projectRoot, { mode: options.mode });

    const { resolveOptionsAsync } = await import('./resolveOptions.js');
    const props = await resolveOptionsAsync(projectRoot, options);

    const { compileAndroidAsync } = await import('./compileAndroidAsync.js');
    await compileAndroidAsync(projectRoot, props);
  } catch (error) {
    return logCmdError(error);
  }
};

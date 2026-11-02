import chalk from 'chalk';

import type { Command } from '../../index';
import * as Log from '../../log';
import { logCmdError } from '../../utils/errors';
import { findUpProjectRootOrAssert } from '../../utils/findUp';
import { parseCompileArgs } from '../args';
import { getHelp } from './help';

export const expoCompileIos: Command = async (argv) => {
  try {
    const { values } = parseCompileArgs(argv);

    if (values.help) {
      Log.log(getHelp());
      return;
    }

    assertPlatform();

    const { resolveOptions } = await import('../resolveOptions.js');
    const options = resolveOptions('ios', values);

    const projectRoot = findUpProjectRootOrAssert(process.cwd());
    const { loadEnvFiles } = await import('../../utils/nodeEnv.js');
    loadEnvFiles(projectRoot, { mode: options.mode });

    const { resolveOptionsAsync } = await import('./resolveOptions.js');
    const props = await resolveOptionsAsync(projectRoot, options);

    const { compileIosAsync } = await import('./compileIosAsync.js');
    await compileIosAsync(projectRoot, props);
  } catch (error) {
    return logCmdError(error);
  }
};

function assertPlatform() {
  if (process.platform !== 'darwin') {
    Log.exit(
      chalk`iOS apps can only be built on macOS devices. Use {cyan eas build -p ios} to build in the cloud.`
    );
  }
}

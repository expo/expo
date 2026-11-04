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

function assertPlatform() {
  if (process.platform !== 'darwin') {
    Log.exit(
      chalk`iOS apps can only be built on macOS devices. Use {cyan eas build -p ios} to build in the cloud.`
    );
  }
}

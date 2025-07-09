import chalk from 'chalk';
import { promisify } from 'util';
import type webpack from 'webpack';

import { formatWebpackMessages } from './formatWebpackMessages';
import * as Log from '../../../log';
import { CommandError } from '../../../utils/errors';

/** Run the `webpack` compiler and format errors/warnings. */
export async function compileAsync(compiler: webpack.Compiler) {
  const stats = await promisify(compiler.run.bind(compiler))();
  const { errors, warnings } = formatWebpackMessages(
    stats.toJson({ all: false, warnings: true, errors: true })
  );
  if (errors?.length) {
    // Only keep the first error. Others are often indicative
    // of the same problem, but confuse the reader with noise.
    if (errors.length > 1) {
      errors.length = 1;
    }
    throw new CommandError('WEBPACK_BUNDLE', errors.join('\n\n'));
  }
  if (warnings?.length) {
    Log.warn(chalk.yellow('Compiled with warnings\n'));
    Log.warn(warnings.join('\n\n'));
  } else {
    Log.log(chalk.green('Compiled successfully'));
  }

  return { errors, warnings };
}

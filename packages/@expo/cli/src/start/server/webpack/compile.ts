import chalk from 'chalk';
import type webpack from 'webpack';

import * as Log from '../../../log';
import { CommandError } from '../../../utils/errors';
import { formatWebpackMessages } from './formatWebpackMessages';

export async function compileAsync(compiler: webpack.Compiler): Promise<any> {
  const stats = await compilerRunAsync(compiler);
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

  return warnings;
}

async function compilerRunAsync(compiler: webpack.Compiler): Promise<webpack.Stats> {
  return new Promise((resolve, reject) =>
    compiler.run((error, stats) => {
      if (error) {
        return reject(error);
      } else {
        return resolve(stats);
      }
    })
  );
}

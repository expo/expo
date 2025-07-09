import chalk from 'chalk';
import { boolish } from 'getenv';

import { Options, createFingerprintAsync } from '../../../build/index';
import { Command } from '../cli';
import { assertArgs, getProjectRoot } from '../utils/args';
import { CommandError } from '../utils/errors';
import * as Log from '../utils/log';
import { withConsoleDisabledAsync } from '../utils/withConsoleDisabledAsync';

export const generateFingerprintAsync: Command = async (argv) => {
  const args = assertArgs(
    {
      // Types
      '--help': Boolean,
      '--platform': [String],
      '--concurrent-io-limit': Number,
      '--hash-algorithm': String,
      '--ignore-path': [String],
      '--source-skips': Number,
      '--debug': Boolean,
      // Aliases
      '-h': '--help',
    },
    argv ?? []
  );

  if (args['--help']) {
    Log.exit(
      chalk`
{bold Description}
Generate fingerprint for a project

{bold Usage}
  {dim $} npx @expo/fingerprint fingerprint:generate

  Options
  --platform <string[]>                Limit native files to those for specified platforms. Default is ['android', 'ios'].
  --concurrent-io-limit <number>       I/O concurrent limit. Default is the number of CPU cores.
  --hash-algorithm <string>            The algorithm to use for crypto.createHash(). Default is 'sha1'.
  --ignore-path <string[]>             Ignore files and directories from hashing. The supported pattern is the same as glob().
  --source-skips <number>              Skips some sources from fingerprint. Value is the result of bitwise-OR'ing desired values of SourceSkips. Default is DEFAULT_SOURCE_SKIPS.
  --debug                              Whether to include verbose debug information in output
  -h, --help                           Output usage information
    `,
      0
    );
  }

  const platforms = args['--platform'];
  if (platforms) {
    if (!Array.isArray(platforms)) {
      throw new CommandError(`Invalid value for --platform`);
    }

    if (!(platforms as any[]).every((elem) => ['ios', 'android'].includes(elem))) {
      throw new CommandError(`Invalid value for --platform: ${platforms}`);
    }
  }

  const concurrentIoLimit = args['--concurrent-io-limit'];
  if (concurrentIoLimit && !Number.isInteger(concurrentIoLimit)) {
    throw new CommandError(
      `Invalid value for --concurrent-io-limit argument: ${concurrentIoLimit}`
    );
  }

  const hashAlgorithm = args['--hash-algorithm'];
  if (hashAlgorithm && typeof hashAlgorithm !== 'string') {
    throw new CommandError(`Invalid value for --hash-algorithm: ${hashAlgorithm}`);
  }

  const ignorePaths = args['--ignore-path'];
  if (ignorePaths) {
    if (!Array.isArray(ignorePaths)) {
      throw new CommandError(`Invalid value for --ignore-path`);
    }

    if (!(ignorePaths as any[]).every((elem) => typeof elem === 'string')) {
      throw new CommandError(`Invalid value for --ignore-path: ${ignorePaths}`);
    }
  }

  const sourceSkips = args['--source-skips'];
  if (sourceSkips && !Number.isInteger(sourceSkips)) {
    throw new CommandError(`Invalid value for --source-skips argument: ${sourceSkips}`);
  }

  const options: Options = {
    debug: !!process.env.DEBUG || args['--debug'],
    silent: true,
    useRNCoreAutolinkingFromExpo: process.env['USE_RNCORE_AUTOLINKING_FROM_EXPO']
      ? boolish('USE_RNCORE_AUTOLINKING_FROM_EXPO')
      : undefined,
    ...(platforms ? { platforms } : null),
    ...(concurrentIoLimit ? { concurrentIoLimit } : null),
    ...(hashAlgorithm ? { hashAlgorithm } : null),
    ...(ignorePaths ? { ignorePaths } : null),
    ...(sourceSkips ? { sourceSkips } : null),
  };

  const projectRoot = getProjectRoot(args);

  const result = await withConsoleDisabledAsync(async () => {
    try {
      return await createFingerprintAsync(projectRoot, options);
    } catch (e: any) {
      throw new CommandError(e.message);
    }
  });

  console.log(JSON.stringify(result));
};

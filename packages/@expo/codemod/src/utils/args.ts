import chalk from 'chalk';
import { parseArgs, type ParseArgsConfig } from 'util';

import * as Log from '../log';

const isParseArgsError = (error: unknown): error is Error & { code: string } => {
  if (!error || typeof error !== 'object' || !('code' in error)) return false;
  const code = (error as { code: unknown }).code;
  return typeof code === 'string' && code.startsWith('ERR_PARSE_ARGS_');
};

export function parseArgsOrExit<T extends ParseArgsConfig>(
  config: T
): ReturnType<typeof parseArgs<T>> {
  try {
    return parseArgs(config);
  } catch (error: unknown) {
    if (isParseArgsError(error)) {
      Log.exit(error.message, 1);
    }
    throw error;
  }
}

export function printHelp(info: string, usage: string, options: string, extra: string = ''): never {
  Log.exit(
    chalk`
  {bold Info}
    ${info}

  {bold Usage}
    {dim $} ${usage}

  {bold Options}
    ${options.split('\n').join('\n    ')}
` + extra,
    0
  );
}

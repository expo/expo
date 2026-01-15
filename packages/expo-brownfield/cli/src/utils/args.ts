import arg from 'arg';

import { Errors } from '../constants';
import type { ParseArgsParams } from './types';

export const parseArgs = ({ spec, argv, stopAtPositional }: ParseArgsParams) => {
  try {
    const parsed = arg(spec, { argv, stopAtPositional });
    return parsed;
  } catch (error: unknown) {
    if (error instanceof arg.ArgError) {
      return Errors.unknownOption(error);
    }

    return Errors.generic(error);
  }
};

import arg from 'arg';
import { existsSync } from 'fs';
import { resolve } from 'path';

import * as Log from '../log';

export function getProjectRoot(args: arg.Result<arg.Spec>) {
  const projectRoot = resolve(args._[0] || '.');

  if (!existsSync(projectRoot)) {
    Log.exit(`Invalid project root: ${projectRoot}`);
  }

  return projectRoot;
}

export function assertArgs(schema: arg.Spec, argv: string[]): arg.Result<arg.Spec> {
  try {
    return arg(schema, { argv });
  } catch (error) {
    if (error.code === 'ARG_UNKNOWN_OPTION') {
      Log.exit(error.message, 1);
    }
    throw error;
  }
}

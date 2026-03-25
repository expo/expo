import type { Command } from '../../../bin/cli';
import { assertWithOptionsArgs } from '../../utils/args';

export const expoBuildIos: Command = async (argv) => {
  const args = assertWithOptionsArgs({
    // Types
    '--help': Boolean,
    '--development': Boolean,
    '--production': Boolean,
    
    '--scheme': String,
    '--configuration': String,

    // Aliases
    '-h': '--help',
  }, { argv, permissive: true });
};

import commander from 'commander';

import { generateModulesProviderCommand } from './commands/generateModulesProviderCommand';
import { reactNativeConfigCommand } from './commands/reactNativeConfigCommand';
import { resolveCommand } from './commands/resolveCommand';
import { searchCommand } from './commands/searchCommand';
import { verifyCommand } from './commands/verifyCommand';

async function main(args: string[]) {
  const cli = commander
    .version(require('expo-modules-autolinking/package.json').version)
    .description('CLI command that searches for native modules to autolink them.');

  verifyCommand(cli);
  searchCommand(cli);
  resolveCommand(cli);
  generateModulesProviderCommand(cli);
  reactNativeConfigCommand(cli);

  await cli.parseAsync(args, { from: 'user' });
}

module.exports = main;

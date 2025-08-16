import commander from 'commander';

import { generateModulesProviderCommand } from './commands/generateModulesProviderCommand';
import { generatePackageListCommand } from './commands/generatePackageListCommand';
import { reactNativeConfigCommand } from './commands/reactNativeConfigCommand';
import { resolveCommand } from './commands/resolveCommand';
import { searchCommand } from './commands/searchCommand';
import { verifyCommand } from './commands/verifyCommand';

async function main(args: string[]) {
  await commander
    .version(require('expo-modules-autolinking/package.json').version)
    .description('CLI command that searches for native modules to autolink them.')
    .parseAsync(args, { from: 'user' });

  verifyCommand();
  searchCommand();
  resolveCommand();
  generatePackageListCommand();
  generateModulesProviderCommand();
  reactNativeConfigCommand();
}

module.exports = main;

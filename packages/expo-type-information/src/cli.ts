import { Command } from 'commander';

import { isSourceKittenInstalled } from './commands/commandUtils';
import { generateMocksForFileCommand } from './commands/generateMocksForFileCommand';
import { inlineModulesInterfaceCommand } from './commands/inlineModulesInterfaceCommand';
import { typeInformationCommand } from './commands/typeInformationCommand';
import { generateModuleTypesCommand } from './commands/generateModuleTypesCommand';
import { generateViewTypesCommand } from './commands/generateViewTypesCommand';
import { generateJsxIntrinsics } from './commands/generateJSXIntrinsicsCommand';
import { shortModuleInterfaceCommand } from './commands/shortModuleInterfaceCommand';
import { moduleInterfaceCommand } from './commands/moduleInterfaceCommand';

async function main(args: string[]) {
  if (!isSourceKittenInstalled()) {
    console.error('Sourcekitten not found! Install it like so: brew install sourcekitten');
    return;
  }
  const cli = new Command();
  cli
    .name('expo-type-information')
    .version(require('../package.json').version)
    .description('CLI commands for retrieving type information from native files.');

  moduleInterfaceCommand(cli);
  inlineModulesInterfaceCommand(cli);
  shortModuleInterfaceCommand(cli);
  generateMocksForFileCommand(cli);

  const otherCommands = cli.command('other').description('internal or very specific commands');
  typeInformationCommand(otherCommands);
  generateModuleTypesCommand(otherCommands);
  generateViewTypesCommand(otherCommands);
  generateJsxIntrinsics(otherCommands);

  await cli.parseAsync(args, { from: 'user' });
}

main(process.argv.slice(2));

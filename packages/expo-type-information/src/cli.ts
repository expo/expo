import { Command } from 'commander';

import { isSourceKittenInstalled } from './commands/commandUtils';
import { generateJsxIntrinsics } from './commands/generateJSXIntrinsicsCommand';
import { generateMocksForFileCommand } from './commands/generateMocksForFileCommand';
import { generateModuleTypesCommand } from './commands/generateModuleTypesCommand';
import { generateViewTypesCommand } from './commands/generateViewTypesCommand';
import { inlineModulesInterfaceCommand } from './commands/inlineModulesInterfaceCommand';
import { moduleInterfaceCommand } from './commands/moduleInterfaceCommand';
import { shortModuleInterfaceCommand } from './commands/shortModuleInterfaceCommand';
import { typeInformationCommand } from './commands/typeInformationCommand';

async function main(args: string[]) {
  if (!isSourceKittenInstalled()) {
    console.error('Sourcekitten not found! Install it like so: brew install sourcekitten');
    return;
  }
  const cli = new Command();
  cli
    .name('expo-type-information')
    .version(require('../package.json').version)
    .description('Retrieve type information from Swift Expo modules to generate TypeScript.');

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

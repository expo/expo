import { Command } from 'commander';

import { generateTypesCommand } from './commands/generateTypesCommand';

async function main(args: string[]) {
  const cli = new Command()
    .name('expo-modules')
    .version(require('../package.json').version)
    .description('Command-line tools for developing Expo modules.');

  generateTypesCommand(cli);

  await cli.parseAsync(args, { from: 'user' });
}

module.exports = main;

import { Command } from '@expo/commander';
import chalk from 'chalk';

export default (program: Command) => {
  program
    .command('ios-generate-dynamic-macros')
    .description('Deprecated: use the shell script directly.')
    .allowUnknownOption()
    .action(() => {
      console.log(
        chalk.yellow('This command has been deprecated.\n\n') +
          'Use the shell script directly instead:\n' +
          chalk.cyan('  apps/expo-go/ios/Build-Phases/generate-dynamic-macros.sh\n\n') +
          'The script no longer requires Node.js or expotools.'
      );
      process.exit(1);
    });
};

import chalk from 'chalk';
import checkForUpdate from 'update-check';

const packageJson = require('../package.json');

const debug = require('debug')('expo:init:update-check') as typeof console.log;

export default async function shouldUpdate(): Promise<void> {
  try {
    const res = await checkForUpdate(packageJson);
    if (res?.latest) {
      console.log();
      console.log(chalk.yellow.bold(`A new version of \`${packageJson.name}\` is available`));
      console.log(chalk`You can update by running: {cyan npm install -g ${packageJson.name}}`);
      console.log();
    }
  } catch (error: any) {
    debug('Error checking for update:\n%O', error);
  }
}

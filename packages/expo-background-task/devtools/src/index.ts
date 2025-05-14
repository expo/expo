import chalk from 'chalk';
import { execSync } from 'child_process';
import prompts from 'prompts';

export default async () => {
  const results = await prompts([
    {
      type: 'select',
      name: 'color',
      message: 'Select command',
      choices: [
        { title: 'Android: List devices', value: 'listDevices' },
        { title: 'iOS: do something', value: 'doSomething' },
      ],
    },
  ]);
  switch (results.color) {
    case 'listDevices':
      console.log(execSync('adb devices', { encoding: 'utf-8' }).trim());
      break;
    case 'doSomething':
      console.log(chalk.green('Green'));
      break;
    default:
      console.log(chalk.white('Unknown color'));
      break;
  }
};

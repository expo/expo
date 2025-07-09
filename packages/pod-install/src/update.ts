import chalk from 'chalk';
import checkForUpdate from 'update-check';

export default async function shouldUpdate() {
  const packageJson = require('../package.json');

  const update = checkForUpdate(packageJson).catch(() => null);

  try {
    const res = await update;
    if (res && res.latest) {
      console.log();
      console.log(chalk.yellow.bold(`A new version of \`${packageJson.name}\` is available`));
      console.log('You can update by running: ' + chalk.cyan(`npm i -g ${packageJson.name}`));
      console.log();
    }
  } catch {
    // ignore error
  }
}

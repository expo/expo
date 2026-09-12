import chalk from 'chalk';
import checkForUpdate from 'update-check';

export const PACKAGE_NAME = 'create-expo';

const getPackageJson = () => {
  try {
    return require('create-expo/package.json');
  } catch {
    return null;
  }
};

const debug = require('debug')('expo:init:update-check') as typeof console.log;

export default async function shouldUpdate(): Promise<void> {
  try {
    const pkg = getPackageJson();
    const res = await checkForUpdate(pkg);
    if (res?.latest) {
      console.log();
      console.log(
        chalk.yellow.bold(`A new version of \`${pkg?.name ?? PACKAGE_NAME}\` is available`)
      );
      console.log(
        chalk`You can update by running: {cyan npm install -g ${pkg?.name ?? PACKAGE_NAME}}`
      );
      console.log();
    }
  } catch (error: any) {
    debug('Error checking for update:\n%O', error);
  }
}

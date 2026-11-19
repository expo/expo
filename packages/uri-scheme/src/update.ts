import chalk from 'chalk';
import checkForUpdate from 'update-check';

export const PACKAGE_NAME = 'uri-scheme';

export default async function shouldUpdate(): Promise<void> {
  const packageJson = () => {
    try {
      return require('uri-scheme/package.json');
    } catch {
      return null;
    }
  };

  const update = checkForUpdate(packageJson()).catch(() => null);

  try {
    const res = await update;
    if (res && res.latest) {
      const _packageJson = packageJson();
      console.log();
      console.log(
        chalk.yellow.bold(`A new version of \`${_packageJson?.name ?? PACKAGE_NAME}\` is available`)
      );
      console.log(
        'You can update by running: ' + chalk.cyan(`npm i -g ${_packageJson?.name ?? PACKAGE_NAME}`)
      );
      console.log();
    }
  } catch {
    // ignore error
  }
}

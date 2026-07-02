import { styleText } from 'node:util';
import checkForUpdate from 'update-check';

export default async function shouldUpdate(): Promise<void> {
  const packageJson = () => require('../package.json');

  const update = checkForUpdate(packageJson()).catch(() => null);

  try {
    const res = await update;
    if (res && res.latest) {
      const _packageJson = packageJson();
      console.log();
      console.log(
        styleText(['yellow', 'bold'], `A new version of \`${_packageJson.name}\` is available`)
      );
      console.log(
        'You can update by running: ' + styleText('cyan', `npm i -g ${_packageJson.name}`)
      );
      console.log();
    }
  } catch {
    // ignore error
  }
}

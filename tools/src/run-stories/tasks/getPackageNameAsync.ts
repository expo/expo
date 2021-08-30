import inquirer from 'inquirer';
import path from 'path';

export async function getPackageNameAsync(name?: string) {
  let packageName = name || '';

  const cwdPkg = require(path.resolve(process.cwd(), 'package.json'));
  const cwdPkgName = cwdPkg.name;

  if (cwdPkgName && cwdPkgName !== '@expo/expo') {
    packageName = cwdPkgName;
  }

  if (!packageName) {
    const { pkg } = await inquirer.prompt({
      type: 'input',
      name: 'pkg',
      message: 'Which package are you working on?',
    });

    packageName = pkg;
  }

  return packageName;
}

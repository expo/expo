import JsonFile from '@expo/json-file';
import chalk from 'chalk';
import path from 'path';

import { selectPackagesToPublish } from './selectPackagesToPublish';
import logger from '../../Logger';
import { getPackageByName, Package } from '../../Packages';
import { Task } from '../../TasksRunner';
import { CommandOptions, Parcel, TaskArgs } from '../types';

const { cyan, green } = chalk;
const MODULE_TEMPLATE_PKG_NAME = 'expo-module-template';
const TEMPLATE_PACKAGE_JSON_FILENAME = '$package.json';
const PACKAGES_TO_UPDATE = ['expo-modules-core', 'expo-module-scripts'];

/**
 * Updates the module template if necessary.
 */
export const updateModuleTemplate = new Task<TaskArgs>(
  {
    name: 'updateModuleTemplate',
    dependsOn: [selectPackagesToPublish],
    filesToStage: [`packages/${MODULE_TEMPLATE_PKG_NAME}/${TEMPLATE_PACKAGE_JSON_FILENAME}`],
  },
  async (parcels: Parcel[], options: CommandOptions) => {
    logger.info('\n🆙 Updating the module template...');

    const dependencies = parcels.filter((parcel) =>
      PACKAGES_TO_UPDATE.includes(parcel.pkg.packageName)
    );

    if (dependencies.length === 0) {
      logger.debug('Yay, there is no need to update the module template 🥳');
      return;
    }

    const moduleTemplatePkg = getPackageByName(MODULE_TEMPLATE_PKG_NAME);

    if (!moduleTemplatePkg) {
      logger.error(
        `❗️ Unable to find the module template package: ${green(MODULE_TEMPLATE_PKG_NAME)}`
      );
      return;
    }

    await updateTemplatePackageJsonAsync(options, moduleTemplatePkg, dependencies);
  }
);

async function updateTemplatePackageJsonAsync(
  options: Pick<CommandOptions, 'canary'>,
  templatePkg: Package,
  dependencies: Parcel[]
): Promise<void> {
  const packageJsonPath = path.join(templatePkg.path, TEMPLATE_PACKAGE_JSON_FILENAME);
  const packageJson = await JsonFile.readAsync(packageJsonPath);

  for (const { pkg, state } of dependencies) {
    const newVersion = state.releaseVersion;
    const oldVersion = packageJson.devDependencies?.[pkg.packageName];

    if (!newVersion || !oldVersion || oldVersion === newVersion) {
      continue;
    }

    const newVersionRange = options.canary ? newVersion : `^${newVersion}`;

    logger.log(
      `   Updating dev dependency on ${green(pkg.packageName)}:`,
      `${cyan.bold(oldVersion)} -> ${cyan.bold(newVersionRange)}`
    );

    if (packageJson.devDependencies) {
      packageJson.devDependencies[pkg.packageName] = newVersionRange;
    }
  }

  // Save the template for package.json
  await JsonFile.writeAsync(packageJsonPath, packageJson);
}

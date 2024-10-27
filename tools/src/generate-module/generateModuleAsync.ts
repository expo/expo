import chalk from 'chalk';
import * as fs from 'fs-extra';
import * as path from 'path';

import configureModule from './configureModule';
import fetchTemplate from './fetchTemplate';
import promptQuestionsAsync from './promptQuestionsAsync';
import { PACKAGES_DIR, EXPO_DIR } from '../Constants';

const TEMPLATE_PACKAGE_NAME = 'expo-module-template';

export default async function generateModuleAsync(
  newModuleProjectDir: string,
  options: { template?: string; useLocalTemplate?: boolean }
) {
  console.log(
    `Creating new unimodule under ${chalk.magenta(path.relative(EXPO_DIR, newModuleProjectDir))}...`
  );

  let templatePath: string | undefined;

  if (options.template) {
    console.log(`Using custom module template: ${chalk.blue(options.template)}`);
    templatePath = options.template;
  } else if (options.useLocalTemplate) {
    templatePath = path.join(PACKAGES_DIR, TEMPLATE_PACKAGE_NAME);

    console.log(
      `Using local module template from ${chalk.blue(path.relative(EXPO_DIR, templatePath))}`
    );
  }

  const newModulePathFromArgv = newModuleProjectDir && path.resolve(newModuleProjectDir);
  const newModuleName = newModulePathFromArgv && path.basename(newModulePathFromArgv);
  const newModuleParentPath = newModulePathFromArgv
    ? path.dirname(newModulePathFromArgv)
    : process.cwd();

  const configuration = await promptQuestionsAsync(newModuleName);
  const newModulePath = path.resolve(newModuleParentPath, configuration.npmModuleName);
  if (fs.existsSync(newModulePath)) {
    throw new Error(`Module '${newModulePath}' already exists!`);
  }

  await fetchTemplate(newModulePath, templatePath);

  await configureModule(newModulePath, configuration);
}

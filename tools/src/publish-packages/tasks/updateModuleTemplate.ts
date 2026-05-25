import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';

import { selectPackagesToPublish } from './selectPackagesToPublish';
import logger from '../../Logger';
import { getPackageByName, Package } from '../../Packages';
import { Task } from '../../TasksRunner';
import { CommandOptions, Parcel, TaskArgs } from '../types';

const { cyan, green } = chalk;
const MODULE_TEMPLATE_PKG_NAME = 'expo-module-template';
const TEMPLATE_PACKAGE_JSON_FILENAME = '$package.json';
const PACKAGES_TO_UPDATE = ['expo-modules-core', 'expo-module-scripts', 'expo'];

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
  // The template uses EJS syntax (`<% if (usesExpoUI) { -%>`) and can't be
  // parsed as JSON.  Update version strings via text replacement
  const originalPackageJson = await fs.readFile(packageJsonPath, 'utf8');

  const devDepsBlock = findBlock(originalPackageJson, 'devDependencies');
  if (!devDepsBlock) {
    logger.warn(`Could not find devDependencies block in ${packageJsonPath}, skipping update.`);
    return;
  }

  let updatedBody = devDepsBlock.body;
  for (const { pkg, state } of dependencies) {
    const newVersion = state.releaseVersion;
    if (!newVersion) {
      continue;
    }

    const versionRegex = new RegExp(`("${escapeRegExp(pkg.packageName)}"\\s*:\\s*")([^"]+)(")`);
    const match = updatedBody.match(versionRegex);
    if (!match) {
      continue;
    }
    const oldVersion = match[2];
    const newVersionRange = options.canary ? newVersion : `^${newVersion}`;
    if (oldVersion === newVersionRange) {
      continue;
    }

    logger.log(
      `   Updating dev dependency on ${green(pkg.packageName)}:`,
      `${cyan.bold(oldVersion)} -> ${cyan.bold(newVersionRange)}`
    );

    updatedBody = updatedBody.replace(versionRegex, `$1${newVersionRange}$3`);
  }

  if (updatedBody === devDepsBlock.body) {
    return;
  }

  const updatedPackageJson =
    originalPackageJson.slice(0, devDepsBlock.start) +
    updatedBody +
    originalPackageJson.slice(devDepsBlock.end);
  await fs.writeFile(packageJsonPath, updatedPackageJson);
}

function findBlock(
  source: string,
  key: string
): { start: number; end: number; body: string } | null {
  const header = new RegExp(`"${escapeRegExp(key)}"\\s*:\\s*\\{`);
  const headerMatch = source.match(header);
  if (!headerMatch || headerMatch.index === undefined) {
    return null;
  }
  const start = headerMatch.index + headerMatch[0].length;
  let depth = 1;
  for (let i = start; i < source.length; i++) {
    const ch = source[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return { start, end: i, body: source.slice(start, i) };
      }
    }
  }
  return null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

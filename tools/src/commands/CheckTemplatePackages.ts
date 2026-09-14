import { Command } from '@expo/commander';
import JsonFile from '@expo/json-file';
import fs from 'fs-extra';
import path from 'path';
import * as tar from 'tar';

import { PACKAGES_DIR } from '../Constants';
import logger from '../Logger';
import { packToTarballAsync } from '../Npm';
import { getAvailableProjectTemplatesAsync } from '../ProjectTemplates';

const BUNDLED_NATIVE_MODULES_PATH = path.join(PACKAGES_DIR, 'expo/bundledNativeModules.json');
const DEPENDENCY_KEYS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
] as const;

type PackageJson = {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
};

async function readPackedPackageJsonAsync(tarballPath: string): Promise<PackageJson> {
  let contents = '';

  await tar.t({
    file: tarballPath,
    onentry(entry) {
      if (entry.path === 'package/package.json') {
        entry.on('data', (chunk) => {
          contents += chunk.toString('utf8');
        });
      }
    },
  });

  if (!contents) {
    throw new Error(`The packed template ${tarballPath} does not contain package/package.json.`);
  }
  return JSON.parse(contents);
}

async function checkTemplatePackagesAsync(): Promise<void> {
  const bundledNativeModules = await JsonFile.readAsync<Record<string, string>>(
    BUNDLED_NATIVE_MODULES_PATH
  );
  const templates = await getAvailableProjectTemplatesAsync();
  const errors: string[] = [];

  for (const template of templates) {
    const sourcePackageJson = await JsonFile.readAsync<PackageJson>(
      path.join(template.path, 'package.json')
    );
    const packResult = await packToTarballAsync(template.path);

    try {
      const packedPackageJson = await readPackedPackageJsonAsync(packResult.filePath);

      if (packedPackageJson.name !== sourcePackageJson.name) {
        errors.push(
          `${template.packageName}: packed name is ${packedPackageJson.name}, expected ${sourcePackageJson.name}`
        );
      }
      if (packedPackageJson.version !== sourcePackageJson.version) {
        errors.push(
          `${template.packageName}: packed version is ${packedPackageJson.version}, expected ${sourcePackageJson.version}`
        );
      }

      for (const dependencyKey of DEPENDENCY_KEYS) {
        const dependencies = packedPackageJson[dependencyKey] ?? {};

        for (const [dependencyName, versionRange] of Object.entries(dependencies)) {
          if (versionRange.startsWith('workspace:')) {
            errors.push(
              `${template.packageName}: packed ${dependencyKey}.${dependencyName} still uses ${versionRange}`
            );
          }

          const bundledVersionRange = bundledNativeModules[dependencyName];
          if (bundledVersionRange && versionRange !== bundledVersionRange) {
            errors.push(
              `${template.packageName}: packed ${dependencyKey}.${dependencyName} is ${versionRange}, expected ${bundledVersionRange} from bundledNativeModules.json`
            );
          }
        }
      }
    } finally {
      await fs.remove(path.dirname(packResult.filePath));
    }
  }

  if (errors.length > 0) {
    throw new Error(`Template package validation failed:\n- ${errors.join('\n- ')}`);
  }

  logger.success(`Validated ${templates.length} packed template packages.`);
}

export default (program: Command) => {
  program
    .command('check-template-packages')
    .description('Checks packed template dependencies against bundledNativeModules.json.')
    .asyncAction(checkTemplatePackagesAsync);
};

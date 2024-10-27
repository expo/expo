import JsonFile from '@expo/json-file';
import fs from 'fs-extra';
import path from 'path';

import { TEMPLATES_DIR } from './Constants';

export type Template = {
  name: string;
  version: string;
  path: string;
};

const DEPENDENCIES_KEYS = ['dependencies', 'devDependencies', 'peerDependencies'];

export async function getAvailableProjectTemplatesAsync(): Promise<Template[]> {
  const templates = (await fs.readdir(TEMPLATES_DIR, { withFileTypes: true }))
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => path.join(TEMPLATES_DIR, dirent.name));

  return Promise.all<Template>(
    templates.map(async (templatePath) => {
      const packageJson = await JsonFile.readAsync<Template>(
        path.join(templatePath, 'package.json')
      );

      return {
        name: packageJson.name,
        version: packageJson.version,
        path: templatePath,
      };
    })
  );
}

/**
 * Updates version of the template and its dependencies.
 */
export async function updateTemplateVersionsAsync(
  templatePath: string,
  templateVersion: string,
  dependenciesToUpdate: Record<string, string>
): Promise<void> {
  const packageJsonPath = path.join(templatePath, 'package.json');
  const packageJson = require(packageJsonPath);

  packageJson.version = templateVersion;

  for (const dependencyKey of DEPENDENCIES_KEYS) {
    const dependencies = packageJson[dependencyKey];

    if (!dependencies) {
      continue;
    }
    for (const dependencyName in dependencies) {
      const currentVersion = dependencies[dependencyName];
      const targetVersion = resolveTargetVersionRange(
        dependenciesToUpdate[dependencyName],
        currentVersion
      );

      if (targetVersion && targetVersion !== currentVersion) {
        packageJson[dependencyKey][dependencyName] = targetVersion;
      }
    }
  }
  await JsonFile.writeAsync(packageJsonPath, packageJson);
}

/**
 * Finds target version range, that is usually `bundledModuleVersion` param,
 * but in some specific cases we want to use different version range.
 */
function resolveTargetVersionRange(targetVersionRange: string, currentVersion: string) {
  if (currentVersion === '*') {
    return currentVersion;
  }
  return targetVersionRange;
}

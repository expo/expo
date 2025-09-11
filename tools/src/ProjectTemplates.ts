import JsonFile from '@expo/json-file';
import fs from 'fs-extra';
import path from 'path';

import { TEMPLATES_DIR } from './Constants';
import { Package } from './Packages';

export type Template = {
  name: string;
  version: string;
  path: string;
};

const DEPENDENCIES_KEYS = ['dependencies', 'devDependencies', 'peerDependencies'];

export async function getAvailableProjectTemplatesAsync(): Promise<Package[]> {
  const directoryEntries = await fs.readdir(TEMPLATES_DIR, { withFileTypes: true });

  const candidateTemplateDirectories = directoryEntries
    .filter((dirent) => dirent.isDirectory() && !dirent.name.startsWith('.'))
    .map((dirent) => path.join(TEMPLATES_DIR, dirent.name));

  const existingTemplateDirectories = (
    await Promise.all(
      candidateTemplateDirectories.map(async (templatePath) => {
        const fullPackageJsonPath = path.join(templatePath, 'package.json');
        const hasPackageJson = await fs.pathExists(fullPackageJsonPath);
        return hasPackageJson ? templatePath : null;
      })
    )
  ).filter((templatePath): templatePath is string => Boolean(templatePath));

  return existingTemplateDirectories.map((templatePath) => {
    const fullPackageJsonPath = path.join(templatePath, 'package.json');
    const packageJson = require(fullPackageJsonPath);

    return new Package(templatePath, packageJson);
  });
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

import glob from 'fast-glob';
import fs from 'fs-extra';
import path from 'path';

import { ModuleDescriptor, PackageRevision } from '../types';

/**
 * Generates Java file that contains all autolinked packages.
 */
export async function generatePackageListAsync(
  modules: ModuleDescriptor[],
  targetPath: string,
  namespace: string
): Promise<void> {
  const generatedFileContent = await generatePackageListFileContentAsync(modules, namespace);
  await fs.outputFile(targetPath, generatedFileContent);
}

export async function resolveModuleAsync(
  packageName: string,
  revision: PackageRevision
): Promise<ModuleDescriptor | null> {
  // TODO: Relative source dir should be configurable through the module config.

  // Don't link itself... :D
  if (packageName === '@unimodules/react-native-adapter') {
    return null;
  }

  const [buildGradleFile] = await glob('*/build.gradle', {
    cwd: revision.path,
    ignore: ['**/node_modules/**'],
  });

  // Just in case where the module doesn't have its own `build.gradle`.
  if (!buildGradleFile) {
    return null;
  }

  const sourceDir = path.dirname(path.join(revision.path, buildGradleFile));

  return {
    projectName: convertPackageNameToProjectName(packageName),
    sourceDir,
  };
}

/**
 * Generates the string to put into the generated package list.
 */
async function generatePackageListFileContentAsync(
  modules: ModuleDescriptor[],
  namespace: string
): Promise<string> {
  // TODO: Instead of ignoring `expo` here, make the package class paths configurable from `expo-module.config.json`.
  const packagesClasses = await findAndroidPackagesAsync(
    modules.filter((module) => module.packageName !== 'expo')
  );

  return `package ${namespace};

import java.util.Arrays;
import java.util.List;
import expo.modules.core.interfaces.Package;

public class ExpoModulesPackageList {
  private static class LazyHolder {
    static final List<Package> packagesList = Arrays.<Package>asList(
${packagesClasses.map((packageClass) => `      new ${packageClass}()`).join(',\n')}
    );
  }

  public static List<Package> getPackageList() {
    return LazyHolder.packagesList;
  }
}
`;
}

async function findAndroidPackagesAsync(modules: ModuleDescriptor[]): Promise<string[]> {
  const classes: string[] = [];

  await Promise.all(
    modules.map(async (module) => {
      const files = await glob('src/**/*Package.{java,kt}', {
        cwd: module.sourceDir,
      });

      for (const file of files) {
        const fileContent = await fs.readFile(path.join(module.sourceDir, file), 'utf8');

        const packageRegex = (() => {
          if (process.env.EXPO_SHOULD_USE_LEGACY_PACKAGE_INTERFACE) {
            return /\bimport\s+org\.unimodules\.core\.(interfaces\.Package|BasePackage)\b/;
          } else {
            return /\bimport\s+expo\.modules\.core\.(interfaces\.Package|BasePackage)\b/;
          }
        })();

        // Very naive check to skip non-expo packages
        if (!packageRegex.test(fileContent)) {
          continue;
        }

        const classPathMatches = fileContent.match(/^package ([\w.]+)\b/m);

        if (classPathMatches) {
          const basename = path.basename(file, path.extname(file));
          classes.push(`${classPathMatches[1]}.${basename}`);
        }
      }
    })
  );
  return classes.sort();
}

/**
 * Converts the package name to Android's project name.
 * Example: `@unimodules/core` → `unimodules-core`
 */
function convertPackageNameToProjectName(projectName: string): string {
  return projectName.replace(/^@/g, '').replace(/\W+/g, '-');
}

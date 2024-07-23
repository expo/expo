import glob from 'fast-glob';
import fs from 'fs-extra';
import path from 'path';

import type { ExtraDependencies, ModuleDescriptorAndroid, PackageRevision } from '../types';

const ANDROID_PROPERTIES_FILE = 'gradle.properties';
const ANDROID_EXTRA_BUILD_DEPS_KEY = 'android.extraMavenRepos';

/**
 * Generates Java file that contains all autolinked packages.
 */
export async function generatePackageListAsync(
  modules: ModuleDescriptorAndroid[],
  targetPath: string,
  namespace: string
): Promise<void> {
  const generatedFileContent = await generatePackageListFileContentAsync(modules, namespace);
  await fs.outputFile(targetPath, generatedFileContent);
}

async function findGradleFilesAsync(revision: PackageRevision): Promise<string[]> {
  const configGradlePaths = revision.config?.androidGradlePaths();
  if (configGradlePaths && configGradlePaths.length) {
    return configGradlePaths;
  }

  const buildGradleFiles = await glob('*/build.gradle', {
    cwd: revision.path,
    ignore: ['**/node_modules/**'],
  });

  return buildGradleFiles;
}

export async function resolveModuleAsync(
  packageName: string,
  revision: PackageRevision
): Promise<ModuleDescriptorAndroid | null> {
  // TODO: Relative source dir should be configurable through the module config.

  // Don't link itself... :D
  if (packageName === '@unimodules/react-native-adapter') {
    return null;
  }

  const buildGradleFiles = await findGradleFilesAsync(revision);
  // Just in case where the module doesn't have its own `build.gradle`.
  if (!buildGradleFiles.length) {
    return null;
  }

  const projects = buildGradleFiles.map((buildGradleFile) => {
    const gradleFilePath = path.join(revision.path, buildGradleFile);
    return {
      name: convertPackageNameToProjectName(
        packageName,
        path.relative(revision.path, gradleFilePath)
      ),
      sourceDir: path.dirname(gradleFilePath),
    };
  });

  const plugins = (revision.config?.androidGradlePlugins() ?? []).map(
    ({ id, group, sourceDir }) => ({
      id,
      group,
      sourceDir: path.join(revision.path, sourceDir),
    })
  );

  return {
    packageName,
    projects,
    ...(plugins.length > 0 ? { plugins } : {}),
    modules: revision.config?.androidModules() ?? [],
  };
}

export async function resolveExtraBuildDependenciesAsync(
  projectNativeRoot: string
): Promise<ExtraDependencies | null> {
  const propsFile = path.join(projectNativeRoot, ANDROID_PROPERTIES_FILE);
  try {
    const contents = await fs.readFile(propsFile, 'utf8');
    const extraMavenReposString = searchGradlePropertyFirst(contents, ANDROID_EXTRA_BUILD_DEPS_KEY);
    if (extraMavenReposString) {
      const extraMavenRepos = JSON.parse(extraMavenReposString);
      return extraMavenRepos;
    }
  } catch {}
  return null;
}

/**
 * Generates the string to put into the generated package list.
 */
async function generatePackageListFileContentAsync(
  modules: ModuleDescriptorAndroid[],
  namespace: string
): Promise<string> {
  // TODO: Instead of ignoring `expo` here, make the package class paths configurable from `expo-module.config.json`.
  const packagesClasses = await findAndroidPackagesAsync(
    modules.filter((module) => module.packageName !== 'expo')
  );

  const modulesClasses = await findAndroidModules(modules);

  return `package ${namespace};

import java.util.Arrays;
import java.util.List;
import expo.modules.core.interfaces.Package;
import expo.modules.kotlin.modules.Module;
import expo.modules.kotlin.ModulesProvider;

public class ExpoModulesPackageList implements ModulesProvider {
  private static class LazyHolder {
    static final List<Package> packagesList = Arrays.<Package>asList(
${packagesClasses.map((packageClass) => `      new ${packageClass}()`).join(',\n')}
    );

    static final List<Class<? extends Module>> modulesList = Arrays.<Class<? extends Module>>asList(
      ${modulesClasses.map((moduleClass) => `      ${moduleClass}.class`).join(',\n')}
    );
  }

  public static List<Package> getPackageList() {
    return LazyHolder.packagesList;
  }

  @Override
  public List<Class<? extends Module>> getModulesList() {
    return LazyHolder.modulesList;
  }
}
`;
}

function findAndroidModules(modules: ModuleDescriptorAndroid[]): string[] {
  const modulesToProvide = modules.filter((module) => module.modules.length > 0);
  const classNames = ([] as string[]).concat(...modulesToProvide.map((module) => module.modules));
  return classNames;
}

async function findAndroidPackagesAsync(modules: ModuleDescriptorAndroid[]): Promise<string[]> {
  const classes: string[] = [];

  const flattenedSourceDirList: string[] = [];
  for (const module of modules) {
    for (const project of module.projects) {
      flattenedSourceDirList.push(project.sourceDir);
    }
  }

  await Promise.all(
    flattenedSourceDirList.map(async (sourceDir) => {
      const files = await glob('**/*Package.{java,kt}', {
        cwd: sourceDir,
      });

      for (const file of files) {
        const fileContent = await fs.readFile(path.join(sourceDir, file), 'utf8');

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
 * Converts the package name and gradle file path to Android's project name.
 *   `$` to indicate subprojects
 *   `/` path will transform as `-`
 *
 * Example: `@expo/example` + `android/build.gradle` → `expo-example`
 *
 * Example: multiple projects
 *   - `expo-test` + `android/build.gradle` → `react-native-third-party`
 *   - `expo-test` + `subproject/build.gradle` → `react-native-third-party$subproject`
 */
export function convertPackageNameToProjectName(
  packageName: string,
  buildGradleFile: string
): string {
  const name = packageName.replace(/^@/g, '').replace(/\W+/g, '-');
  const baseDir = path.dirname(buildGradleFile).replace(/\//g, '-');
  return baseDir === 'android' ? name : `${name}$${baseDir}`;
}

/**
 * Given the contents of a `gradle.properties` file,
 * searches for a property with the given name.
 *
 * This function will return the first property found with the given name.
 * The implementation follows config-plugins and
 * tries to align the behavior with the `withGradleProperties` plugin.
 */
export function searchGradlePropertyFirst(contents: string, propertyName: string): string | null {
  const lines = contents.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && !line.startsWith('#')) {
      const eok = line.indexOf('=');
      const key = line.slice(0, eok);
      if (key === propertyName) {
        const value = line.slice(eok + 1, line.length);
        return value;
      }
    }
  }
  return null;
}

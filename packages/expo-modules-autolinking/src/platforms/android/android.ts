import fs from 'fs';
import path from 'path';

import { AutolinkingOptions } from '../../commands/autolinkingOptions';
import { taskAll } from '../../concurrency';
import type { ExtraDependencies, ModuleDescriptorAndroid, PackageRevision } from '../../types';
import { scanFilesRecursively } from '../../utils';

const ANDROID_PROPERTIES_FILE = 'gradle.properties';
const ANDROID_EXTRA_BUILD_DEPS_KEY = 'android.extraMavenRepos';

interface AndroidConfigurationOutput {
  buildFromSource: string[];
}

export function getConfiguration(
  options: AutolinkingOptions
): AndroidConfigurationOutput | undefined {
  return options.buildFromSource ? { buildFromSource: options.buildFromSource } : undefined;
}

export function isAndroidProject(projectRoot: string): boolean {
  return (
    fs.existsSync(path.join(projectRoot, 'build.gradle')) ||
    fs.existsSync(path.join(projectRoot, 'build.gradle.kts'))
  );
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

  const plugins = (revision.config?.androidGradlePlugins() ?? []).map(
    ({ id, group, sourceDir, applyToRootProject }) => ({
      id,
      group,
      sourceDir: path.join(revision.path, sourceDir),
      applyToRootProject: applyToRootProject ?? true,
    })
  );

  const defaultProjectName = convertPackageToProjectName(packageName);

  const androidProjects = revision.config
    ?.androidProjects(defaultProjectName)
    ?.filter((project) => {
      return !project.isDefault || isAndroidProject(path.join(revision.path, project.path));
    });

  // Just in case where the module doesn't have its own `build.gradle`/`settings.gradle`.
  if (!androidProjects?.length) {
    if (!plugins.length) {
      return null;
    }

    return {
      packageName,
      plugins,
    };
  }

  const projects = await taskAll(androidProjects, async (project) => {
    const projectPath = path.join(revision.path, project.path);

    const aarProjects = (project.gradleAarProjects ?? [])?.map((aarProject) => {
      const projectName = `${defaultProjectName}$${aarProject.name}`;
      const projectDir = path.join(projectPath, 'build', projectName);
      return {
        name: projectName,
        aarFilePath: path.join(revision.path, aarProject.aarFilePath),
        projectDir,
      };
    });

    const { publication } = project;
    const shouldUsePublicationScriptPath = project.shouldUsePublicationScriptPath
      ? path.join(revision.path, project.shouldUsePublicationScriptPath)
      : undefined;

    const packages = new Set<string>();
    for await (const file of scanFilesRecursively(projectPath)) {
      if (!file.name.endsWith('Package.java') && !file.name.endsWith('Package.kt')) {
        continue;
      }
      const fileContent = await fs.promises.readFile(file.path, 'utf8');

      // Very naive check to skip non-expo packages
      if (
        !/\bimport\s+expo\.modules\.core\.(interfaces\.Package|BasePackage)\b/.test(fileContent)
      ) {
        continue;
      }

      const classPathMatches = fileContent.match(/^package ([\w.]+)\b/m);

      if (classPathMatches) {
        const basename = path.basename(file.name, path.extname(file.name));
        packages.add(`${classPathMatches[1]}.${basename}`);
      }
    }

    return {
      name: project.name,
      sourceDir: projectPath,
      modules: project.modules ?? [],
      services: project.services ?? [],
      packages: [...packages].sort((a, b) => a.localeCompare(b)),
      ...(shouldUsePublicationScriptPath ? { shouldUsePublicationScriptPath } : {}),
      ...(publication ? { publication } : {}),
      ...(aarProjects?.length > 0 ? { aarProjects } : {}),
    };
  });

  const coreFeatures = revision.config?.coreFeatures() ?? [];

  return {
    packageName,
    projects,
    ...(plugins?.length > 0 ? { plugins } : {}),
    ...(coreFeatures.length > 0 ? { coreFeatures } : {}),
  };
}

export async function resolveExtraBuildDependenciesAsync(
  projectNativeRoot: string
): Promise<ExtraDependencies | null> {
  const extraMavenReposString = await resolveGradlePropertyAsync(
    projectNativeRoot,
    ANDROID_EXTRA_BUILD_DEPS_KEY
  );
  if (extraMavenReposString) {
    try {
      return JSON.parse(extraMavenReposString);
    } catch {}
  }
  return null;
}

export async function resolveGradlePropertyAsync(
  projectNativeRoot: string,
  propertyKey: string
): Promise<string | null> {
  const propsFile = path.join(projectNativeRoot, ANDROID_PROPERTIES_FILE);
  try {
    const contents = await fs.promises.readFile(propsFile, 'utf8');
    const propertyValue = searchGradlePropertyFirst(contents, propertyKey);
    if (propertyValue) {
      return propertyValue;
    }
  } catch {}
  return null;
}

/**
 * Converts the package name to Android's project name.
 *   `/` path will transform as `-`
 *
 * Example: `@expo/example` + `android/build.gradle` → `expo-example`
 */
export function convertPackageToProjectName(packageName: string): string {
  return packageName.replace(/^@/g, '').replace(/\W+/g, '-');
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
export function convertPackageWithGradleToProjectName(
  packageName: string,
  buildGradleFile: string
): string {
  const name = convertPackageToProjectName(packageName);
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

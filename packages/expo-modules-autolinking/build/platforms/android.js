"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchGradlePropertyFirst = exports.convertPackageWithGradleToProjectName = exports.convertPackageToProjectName = exports.resolveExtraBuildDependenciesAsync = exports.resolveModuleAsync = exports.generatePackageListAsync = void 0;
const fast_glob_1 = __importDefault(require("fast-glob"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const ANDROID_PROPERTIES_FILE = 'gradle.properties';
const ANDROID_EXTRA_BUILD_DEPS_KEY = 'android.extraMavenRepos';
/**
 * Generates Java file that contains all autolinked packages.
 */
async function generatePackageListAsync(modules, targetPath, namespace) {
    const generatedFileContent = await generatePackageListFileContentAsync(modules, namespace);
    await fs_extra_1.default.outputFile(targetPath, generatedFileContent);
}
exports.generatePackageListAsync = generatePackageListAsync;
async function findGradleFilesAsync(revision) {
    const configGradlePaths = revision.config?.androidGradlePaths();
    if (configGradlePaths && configGradlePaths.length) {
        return configGradlePaths;
    }
    const buildGradleFiles = await (0, fast_glob_1.default)('*/build.gradle{,.kts}', {
        cwd: revision.path,
        ignore: ['**/node_modules/**'],
    });
    return buildGradleFiles;
}
async function resolveModuleAsync(packageName, revision) {
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
    const plugins = (revision.config?.androidGradlePlugins() ?? []).map(({ id, group, sourceDir }) => ({
        id,
        group,
        sourceDir: path_1.default.join(revision.path, sourceDir),
    }));
    const aarProjects = (revision.config?.androidGradleAarProjects() ?? []).map(({ name, aarFilePath }) => {
        const mainProjectName = convertPackageToProjectName(packageName);
        const projectName = `${mainProjectName}$${name}`;
        const projectDir = path_1.default.join(revision.path, 'android', 'build', projectName);
        return {
            name: projectName,
            aarFilePath: path_1.default.join(revision.path, aarFilePath),
            projectDir,
        };
    });
    const projects = buildGradleFiles
        .map((buildGradleFile) => {
        const gradleFilePath = path_1.default.join(revision.path, buildGradleFile);
        return {
            name: convertPackageWithGradleToProjectName(packageName, path_1.default.relative(revision.path, gradleFilePath)),
            sourceDir: path_1.default.dirname(gradleFilePath),
        };
    })
        // Filter out projects that are already linked by plugins
        .filter(({ sourceDir }) => !plugins.some((plugin) => plugin.sourceDir === sourceDir));
    return {
        packageName,
        projects,
        ...(plugins.length > 0 ? { plugins } : {}),
        modules: revision.config?.androidModules() ?? [],
        ...(aarProjects.length > 0 ? { aarProjects } : {}),
    };
}
exports.resolveModuleAsync = resolveModuleAsync;
async function resolveExtraBuildDependenciesAsync(projectNativeRoot) {
    const propsFile = path_1.default.join(projectNativeRoot, ANDROID_PROPERTIES_FILE);
    try {
        const contents = await fs_extra_1.default.readFile(propsFile, 'utf8');
        const extraMavenReposString = searchGradlePropertyFirst(contents, ANDROID_EXTRA_BUILD_DEPS_KEY);
        if (extraMavenReposString) {
            const extraMavenRepos = JSON.parse(extraMavenReposString);
            return extraMavenRepos;
        }
    }
    catch { }
    return null;
}
exports.resolveExtraBuildDependenciesAsync = resolveExtraBuildDependenciesAsync;
/**
 * Generates the string to put into the generated package list.
 */
async function generatePackageListFileContentAsync(modules, namespace) {
    // TODO: Instead of ignoring `expo` here, make the package class paths configurable from `expo-module.config.json`.
    const packagesClasses = await findAndroidPackagesAsync(modules.filter((module) => module.packageName !== 'expo'));
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
function findAndroidModules(modules) {
    const modulesToProvide = modules.filter((module) => module.modules.length > 0);
    const classNames = [].concat(...modulesToProvide.map((module) => module.modules));
    return classNames;
}
async function findAndroidPackagesAsync(modules) {
    const classes = [];
    const flattenedSourceDirList = [];
    for (const module of modules) {
        for (const project of module.projects) {
            flattenedSourceDirList.push(project.sourceDir);
        }
    }
    await Promise.all(flattenedSourceDirList.map(async (sourceDir) => {
        const files = await (0, fast_glob_1.default)('**/*Package.{java,kt}', {
            cwd: sourceDir,
        });
        for (const file of files) {
            const fileContent = await fs_extra_1.default.readFile(path_1.default.join(sourceDir, file), 'utf8');
            const packageRegex = (() => {
                if (process.env.EXPO_SHOULD_USE_LEGACY_PACKAGE_INTERFACE) {
                    return /\bimport\s+org\.unimodules\.core\.(interfaces\.Package|BasePackage)\b/;
                }
                else {
                    return /\bimport\s+expo\.modules\.core\.(interfaces\.Package|BasePackage)\b/;
                }
            })();
            // Very naive check to skip non-expo packages
            if (!packageRegex.test(fileContent)) {
                continue;
            }
            const classPathMatches = fileContent.match(/^package ([\w.]+)\b/m);
            if (classPathMatches) {
                const basename = path_1.default.basename(file, path_1.default.extname(file));
                classes.push(`${classPathMatches[1]}.${basename}`);
            }
        }
    }));
    return classes.sort();
}
/**
 * Converts the package name to Android's project name.
 *   `/` path will transform as `-`
 *
 * Example: `@expo/example` + `android/build.gradle` → `expo-example`
 */
function convertPackageToProjectName(packageName) {
    return packageName.replace(/^@/g, '').replace(/\W+/g, '-');
}
exports.convertPackageToProjectName = convertPackageToProjectName;
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
function convertPackageWithGradleToProjectName(packageName, buildGradleFile) {
    const name = convertPackageToProjectName(packageName);
    const baseDir = path_1.default.dirname(buildGradleFile).replace(/\//g, '-');
    return baseDir === 'android' ? name : `${name}$${baseDir}`;
}
exports.convertPackageWithGradleToProjectName = convertPackageWithGradleToProjectName;
/**
 * Given the contents of a `gradle.properties` file,
 * searches for a property with the given name.
 *
 * This function will return the first property found with the given name.
 * The implementation follows config-plugins and
 * tries to align the behavior with the `withGradleProperties` plugin.
 */
function searchGradlePropertyFirst(contents, propertyName) {
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
exports.searchGradlePropertyFirst = searchGradlePropertyFirst;
//# sourceMappingURL=android.js.map
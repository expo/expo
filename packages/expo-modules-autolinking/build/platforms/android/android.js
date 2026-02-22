"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfiguration = getConfiguration;
exports.isAndroidProject = isAndroidProject;
exports.resolveModuleAsync = resolveModuleAsync;
exports.resolveExtraBuildDependenciesAsync = resolveExtraBuildDependenciesAsync;
exports.resolveGradlePropertyAsync = resolveGradlePropertyAsync;
exports.convertPackageToProjectName = convertPackageToProjectName;
exports.convertPackageWithGradleToProjectName = convertPackageWithGradleToProjectName;
exports.searchGradlePropertyFirst = searchGradlePropertyFirst;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const concurrency_1 = require("../../concurrency");
const utils_1 = require("../../utils");
const ANDROID_PROPERTIES_FILE = 'gradle.properties';
const ANDROID_EXTRA_BUILD_DEPS_KEY = 'android.extraMavenRepos';
function getConfiguration(options) {
    return options.buildFromSource ? { buildFromSource: options.buildFromSource } : undefined;
}
function isAndroidProject(projectRoot) {
    return (fs_1.default.existsSync(path_1.default.join(projectRoot, 'build.gradle')) ||
        fs_1.default.existsSync(path_1.default.join(projectRoot, 'build.gradle.kts')));
}
async function resolveModuleAsync(packageName, revision) {
    // TODO: Relative source dir should be configurable through the module config.
    // Don't link itself... :D
    if (packageName === '@unimodules/react-native-adapter') {
        return null;
    }
    const plugins = (revision.config?.androidGradlePlugins() ?? []).map(({ id, group, sourceDir, applyToRootProject }) => ({
        id,
        group,
        sourceDir: path_1.default.join(revision.path, sourceDir),
        applyToRootProject: applyToRootProject ?? true,
    }));
    const defaultProjectName = convertPackageToProjectName(packageName);
    const androidProjects = revision.config
        ?.androidProjects(defaultProjectName)
        ?.filter((project) => {
        return !project.isDefault || isAndroidProject(path_1.default.join(revision.path, project.path));
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
    const projects = await (0, concurrency_1.taskAll)(androidProjects, async (project) => {
        const projectPath = path_1.default.join(revision.path, project.path);
        const aarProjects = (project.gradleAarProjects ?? [])?.map((aarProject) => {
            const projectName = `${defaultProjectName}$${aarProject.name}`;
            const projectDir = path_1.default.join(projectPath, 'build', projectName);
            return {
                name: projectName,
                aarFilePath: path_1.default.join(revision.path, aarProject.aarFilePath),
                projectDir,
            };
        });
        const { publication } = project;
        const shouldUsePublicationScriptPath = project.shouldUsePublicationScriptPath
            ? path_1.default.join(revision.path, project.shouldUsePublicationScriptPath)
            : undefined;
        const packages = new Set();
        for await (const file of (0, utils_1.scanFilesRecursively)(projectPath)) {
            if (!file.name.endsWith('Package.java') && !file.name.endsWith('Package.kt')) {
                continue;
            }
            const fileContent = await fs_1.default.promises.readFile(file.path, 'utf8');
            // Very naive check to skip non-expo packages
            if (!/\bimport\s+expo\.modules\.core\.(interfaces\.Package|BasePackage)\b/.test(fileContent)) {
                continue;
            }
            const classPathMatches = fileContent.match(/^package ([\w.]+)\b/m);
            if (classPathMatches) {
                const basename = path_1.default.basename(file.name, path_1.default.extname(file.name));
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
async function resolveExtraBuildDependenciesAsync(projectNativeRoot) {
    const extraMavenReposString = await resolveGradlePropertyAsync(projectNativeRoot, ANDROID_EXTRA_BUILD_DEPS_KEY);
    if (extraMavenReposString) {
        try {
            return JSON.parse(extraMavenReposString);
        }
        catch { }
    }
    return null;
}
async function resolveGradlePropertyAsync(projectNativeRoot, propertyKey) {
    const propsFile = path_1.default.join(projectNativeRoot, ANDROID_PROPERTIES_FILE);
    try {
        const contents = await fs_1.default.promises.readFile(propsFile, 'utf8');
        const propertyValue = searchGradlePropertyFirst(contents, propertyKey);
        if (propertyValue) {
            return propertyValue;
        }
    }
    catch { }
    return null;
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
//# sourceMappingURL=android.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveModuleAsync = exports.generatePackageListAsync = void 0;
const fast_glob_1 = __importDefault(require("fast-glob"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
/**
 * Generates Java file that contains all autolinked packages.
 */
async function generatePackageListAsync(modules, targetPath, namespace) {
    const generatedFileContent = await generatePackageListFileContentAsync(modules, namespace);
    await fs_extra_1.default.outputFile(targetPath, generatedFileContent);
}
exports.generatePackageListAsync = generatePackageListAsync;
async function resolveModuleAsync(packageName, revision) {
    // TODO: Relative source dir should be configurable through the module config.
    var _a;
    // Don't link itself... :D
    if (packageName === '@unimodules/react-native-adapter') {
        return null;
    }
    const [buildGradleFile] = await (0, fast_glob_1.default)('*/build.gradle', {
        cwd: revision.path,
        ignore: ['**/node_modules/**'],
    });
    // Just in case where the module doesn't have its own `build.gradle`.
    if (!buildGradleFile) {
        return null;
    }
    const sourceDir = path_1.default.dirname(path_1.default.join(revision.path, buildGradleFile));
    return {
        projectName: convertPackageNameToProjectName(packageName),
        sourceDir,
        modulesClassNames: (_a = revision.config) === null || _a === void 0 ? void 0 : _a.androidModulesClassNames(),
    };
}
exports.resolveModuleAsync = resolveModuleAsync;
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
    const modulesToProvide = modules.filter((module) => module.modulesClassNames.length > 0);
    const classNames = [].concat(...modulesToProvide.map((module) => module.modulesClassNames));
    return classNames;
}
async function findAndroidPackagesAsync(modules) {
    const classes = [];
    await Promise.all(modules.map(async (module) => {
        const files = await (0, fast_glob_1.default)('**/*Package.{java,kt}', {
            cwd: module.sourceDir,
        });
        for (const file of files) {
            const fileContent = await fs_extra_1.default.readFile(path_1.default.join(module.sourceDir, file), 'utf8');
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
 * Example: `@unimodules/core` → `unimodules-core`
 */
function convertPackageNameToProjectName(projectName) {
    return projectName.replace(/^@/g, '').replace(/\W+/g, '-');
}
//# sourceMappingURL=android.js.map
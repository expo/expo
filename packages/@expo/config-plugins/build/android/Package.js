"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApplicationIdAsync = exports.setPackageInBuildGradle = exports.renamePackageOnDiskForType = exports.renameJniOnDiskForType = exports.renamePackageOnDisk = exports.getPackage = exports.withPackageRefactor = exports.withPackageGradle = void 0;
const debug_1 = __importDefault(require("debug"));
const fs_1 = __importDefault(require("fs"));
const glob_1 = require("glob");
const path_1 = __importDefault(require("path"));
const Paths_1 = require("./Paths");
const android_plugins_1 = require("../plugins/android-plugins");
const withDangerousMod_1 = require("../plugins/withDangerousMod");
const modules_1 = require("../utils/modules");
const warnings_1 = require("../utils/warnings");
const debug = (0, debug_1.default)('expo:config-plugins:android:package');
const withPackageGradle = (config) => {
    return (0, android_plugins_1.withAppBuildGradle)(config, (config) => {
        if (config.modResults.language === 'groovy') {
            config.modResults.contents = setPackageInBuildGradle(config, config.modResults.contents);
        }
        else {
            (0, warnings_1.addWarningAndroid)('android.package', `Cannot automatically configure app build.gradle if it's not groovy`);
        }
        return config;
    });
};
exports.withPackageGradle = withPackageGradle;
const withPackageRefactor = (config) => {
    return (0, withDangerousMod_1.withDangerousMod)(config, [
        'android',
        async (config) => {
            await renamePackageOnDisk(config, config.modRequest.projectRoot);
            return config;
        },
    ]);
};
exports.withPackageRefactor = withPackageRefactor;
function getPackage(config) {
    return config.android?.package ?? null;
}
exports.getPackage = getPackage;
function getPackageRoot(projectRoot, type) {
    return path_1.default.join(projectRoot, 'android', 'app', 'src', type, 'java');
}
function getCurrentPackageName(projectRoot, packageRoot) {
    const mainApplication = (0, Paths_1.getProjectFilePath)(projectRoot, 'MainApplication');
    const packagePath = path_1.default.dirname(mainApplication);
    const packagePathParts = path_1.default.relative(packageRoot, packagePath).split(path_1.default.sep).filter(Boolean);
    return packagePathParts.join('.');
}
function getCurrentPackageForProjectFile(projectRoot, packageRoot, fileName, type) {
    const filePath = (0, glob_1.sync)(path_1.default.join(projectRoot, `android/app/src/${type}/java/**/${fileName}.@(java|kt)`))[0];
    if (!filePath) {
        return null;
    }
    const packagePath = path_1.default.dirname(filePath);
    const packagePathParts = path_1.default.relative(packageRoot, packagePath).split(path_1.default.sep).filter(Boolean);
    return packagePathParts.join('.');
}
function getCurrentPackageNameForType(projectRoot, type) {
    const packageRoot = getPackageRoot(projectRoot, type);
    if (type === 'main') {
        return getCurrentPackageName(projectRoot, packageRoot);
    }
    // debug, etc..
    return getCurrentPackageForProjectFile(projectRoot, packageRoot, '*', type);
}
// NOTE(brentvatne): this assumes that our MainApplication.java file is in the root of the package
// this makes sense for standard react-native projects but may not apply in customized projects, so if
// we want this to be runnable in any app we need to handle other possibilities
async function renamePackageOnDisk(config, projectRoot) {
    const newPackageName = getPackage(config);
    if (newPackageName === null) {
        return;
    }
    for (const type of ['debug', 'main', 'release']) {
        await renameJniOnDiskForType({ projectRoot, type, packageName: newPackageName });
        await renamePackageOnDiskForType({ projectRoot, type, packageName: newPackageName });
    }
}
exports.renamePackageOnDisk = renamePackageOnDisk;
async function renameJniOnDiskForType({ projectRoot, type, packageName, }) {
    if (!packageName) {
        return;
    }
    const currentPackageName = getCurrentPackageNameForType(projectRoot, type);
    if (!currentPackageName || !packageName || currentPackageName === packageName) {
        return;
    }
    const jniRoot = path_1.default.join(projectRoot, 'android', 'app', 'src', type, 'jni');
    const filesToUpdate = [...(0, glob_1.sync)('**/*', { cwd: jniRoot, absolute: true })];
    // Replace all occurrences of the path in the project
    filesToUpdate.forEach((filepath) => {
        try {
            if (fs_1.default.lstatSync(filepath).isFile() && ['.h', '.cpp'].includes(path_1.default.extname(filepath))) {
                let contents = fs_1.default.readFileSync(filepath).toString();
                contents = contents.replace(new RegExp(transformJavaClassDescriptor(currentPackageName).replace(/\//g, '\\/'), 'g'), transformJavaClassDescriptor(packageName));
                fs_1.default.writeFileSync(filepath, contents);
            }
        }
        catch {
            debug(`Error updating "${filepath}" for type "${type}"`);
        }
    });
}
exports.renameJniOnDiskForType = renameJniOnDiskForType;
async function renamePackageOnDiskForType({ projectRoot, type, packageName, }) {
    if (!packageName) {
        return;
    }
    const currentPackageName = getCurrentPackageNameForType(projectRoot, type);
    debug(`Found package "${currentPackageName}" for type "${type}"`);
    if (!currentPackageName || currentPackageName === packageName) {
        return;
    }
    debug(`Refactor "${currentPackageName}" to "${packageName}" for type "${type}"`);
    const packageRoot = getPackageRoot(projectRoot, type);
    // Set up our paths
    if (!(await (0, modules_1.directoryExistsAsync)(packageRoot))) {
        debug(`- skipping refactor of missing directory: ${packageRoot}`);
        return;
    }
    const currentPackagePath = path_1.default.join(packageRoot, ...currentPackageName.split('.'));
    const newPackagePath = path_1.default.join(packageRoot, ...packageName.split('.'));
    // Create the new directory
    fs_1.default.mkdirSync(newPackagePath, { recursive: true });
    // Move everything from the old directory over
    (0, glob_1.sync)('**/*', { cwd: currentPackagePath }).forEach((relativePath) => {
        const filepath = path_1.default.join(currentPackagePath, relativePath);
        if (fs_1.default.lstatSync(filepath).isFile()) {
            moveFileSync(filepath, path_1.default.join(newPackagePath, relativePath));
        }
        else {
            fs_1.default.mkdirSync(filepath, { recursive: true });
        }
    });
    // Remove the old directory recursively from com/old/package to com/old and com,
    // as long as the directories are empty
    const oldPathParts = currentPackageName.split('.');
    while (oldPathParts.length) {
        const pathToCheck = path_1.default.join(packageRoot, ...oldPathParts);
        try {
            const files = fs_1.default.readdirSync(pathToCheck);
            if (files.length === 0) {
                fs_1.default.rmdirSync(pathToCheck);
            }
        }
        finally {
            oldPathParts.pop();
        }
    }
    const filesToUpdate = [...(0, glob_1.sync)('**/*', { cwd: newPackagePath, absolute: true })];
    // Only update the BUCK file to match the main package name
    if (type === 'main') {
        // NOTE(EvanBacon): We dropped this file in SDK 48 but other templates may still use it.
        filesToUpdate.push(path_1.default.join(projectRoot, 'android', 'app', 'BUCK'));
    }
    // Replace all occurrences of the path in the project
    filesToUpdate.forEach((filepath) => {
        try {
            if (fs_1.default.lstatSync(filepath).isFile()) {
                let contents = fs_1.default.readFileSync(filepath).toString();
                contents = replacePackageName(contents, currentPackageName, packageName);
                if (['.h', '.cpp'].includes(path_1.default.extname(filepath))) {
                    contents = contents.replace(new RegExp(transformJavaClassDescriptor(currentPackageName).replace(/\//g, '\\'), 'g'), transformJavaClassDescriptor(packageName));
                }
                fs_1.default.writeFileSync(filepath, contents);
            }
        }
        catch {
            debug(`Error updating "${filepath}" for type "${type}"`);
        }
    });
}
exports.renamePackageOnDiskForType = renamePackageOnDiskForType;
function moveFileSync(src, dest) {
    fs_1.default.mkdirSync(path_1.default.dirname(dest), { recursive: true });
    fs_1.default.renameSync(src, dest);
}
function setPackageInBuildGradle(config, buildGradle) {
    const packageName = getPackage(config);
    if (packageName === null) {
        return buildGradle;
    }
    const pattern = new RegExp(`(applicationId|namespace) ['"].*['"]`, 'g');
    return buildGradle.replace(pattern, `$1 '${packageName}'`);
}
exports.setPackageInBuildGradle = setPackageInBuildGradle;
async function getApplicationIdAsync(projectRoot) {
    const buildGradlePath = (0, Paths_1.getAppBuildGradleFilePath)(projectRoot);
    if (!fs_1.default.existsSync(buildGradlePath)) {
        return null;
    }
    const buildGradle = await fs_1.default.promises.readFile(buildGradlePath, 'utf8');
    const matchResult = buildGradle.match(/applicationId ['"](.*)['"]/);
    // TODO add fallback for legacy cases to read from AndroidManifest.xml
    return matchResult?.[1] ?? null;
}
exports.getApplicationIdAsync = getApplicationIdAsync;
/**
 * Replace the package name with the new package name, in the given source.
 * This has to be limited to avoid accidentally replacing imports when the old package name overlaps.
 */
function replacePackageName(content, oldName, newName) {
    const oldNameEscaped = oldName.replace(/\./g, '\\.');
    return (content
        // Replace any quoted instances "com.old" -> "com.new"
        .replace(new RegExp(`"${oldNameEscaped}"`, 'g'), `"${newName}"`)
        // Replace special non-quoted instances, only when prefixed by package or namespace
        .replace(new RegExp(`(package|namespace)(\\s+)${oldNameEscaped}`, 'g'), `$1$2${newName}`)
        // Replace special import instances, without overlapping with other imports (trailing `.` to close it off)
        .replace(new RegExp(`(import\\s+)${oldNameEscaped}\\.`, 'g'), `$1${newName}.`));
}
/**
 * Transform a java package name to java class descriptor,
 * e.g. `com.helloworld` -> `Lcom/helloworld`.
 */
function transformJavaClassDescriptor(packageName) {
    return `L${packageName.replace(/\./g, '/')}`;
}

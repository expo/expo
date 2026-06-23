"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inlineModuleFileNameInformation = inlineModuleFileNameInformation;
exports.getKotlinFileNameWithItsPackage = getKotlinFileNameWithItsPackage;
exports.getSwiftModuleClassName = getSwiftModuleClassName;
exports.hasKotlinModuleDefinition = hasKotlinModuleDefinition;
exports.hasSwiftModuleDefinition = hasSwiftModuleDefinition;
exports.getMirrorStateObject = getMirrorStateObject;
const console_1 = require("console");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const concurrency_1 = require("../concurrency");
const utils_1 = require("../utils");
const nativeExtensions = ['.kt', '.swift'];
// Checks for func definition() -> <anything>ModuleDefinition. <anything> because ExpoModulesCore.ModuleDefinition is a valid usage
const swiftModuleDefinitionRegex = /\bfunc\s+definition\s*\(\s*\)\s*->\s*[\w.]*ModuleDefinition\b/;
// Checks for `override fun definition() = <anything>ModuleDefinition`
const kotlinModuleDefinitionRegex = /\boverride\s+fun\s+definition\s*\(\s*\)\s*=\s*[\w.]*ModuleDefinition\b/;
/**
 * Checks if the fileName is valid for inline module scanning.
 * Swift and Kotlin files are classified as modules by reading their contents.
 */
function inlineModuleFileNameInformation(fileName) {
    const ext = path_1.default.extname(fileName);
    if (!nativeExtensions.includes(ext)) {
        return { valid: false, ext };
    }
    return { valid: true, ext };
}
async function getKotlinFileNameWithItsPackage(absoluteFilePath) {
    const HEADER_SIZE = 512;
    const buffer = Buffer.alloc(HEADER_SIZE);
    let fileHandle;
    try {
        fileHandle = await fs_1.default.promises.open(absoluteFilePath, 'r');
    }
    catch (e) {
        (0, console_1.warn)(`Kotlin inline module '${absoluteFilePath}' couldn't be opened.`);
        return null;
    }
    try {
        const { bytesRead } = await fileHandle.read(buffer, 0, HEADER_SIZE, 0);
        const header = buffer.toString('utf8', 0, bytesRead);
        // We want to find `package some.package` and capture the `some.package` from it.
        const pacakgeRegex = /^package\s+([\w.]+)/m;
        const packageMatch = header.match(pacakgeRegex);
        if (!packageMatch) {
            (0, console_1.warn)(`Package name couldn't be found in ${absoluteFilePath}.`);
            return null;
        }
        return `${packageMatch[1]}.${path_1.default.basename(absoluteFilePath, path_1.default.extname(absoluteFilePath))}`;
    }
    catch (e) {
        console.warn(`Couldn't read inline module '${absoluteFilePath}' package.`);
        return null;
    }
    finally {
        await fileHandle.close();
    }
}
function getSwiftModuleClassName(absoluteFilePath) {
    return path_1.default.basename(absoluteFilePath, path_1.default.extname(absoluteFilePath));
}
async function hasKotlinModuleDefinition(absoluteFilePath) {
    try {
        const contents = await fs_1.default.promises.readFile(absoluteFilePath, 'utf8');
        return kotlinModuleDefinitionRegex.test(contents);
    }
    catch {
        (0, console_1.warn)(`Kotlin inline module '${absoluteFilePath}' could not be opened.`);
        return false;
    }
}
async function hasSwiftModuleDefinition(absoluteFilePath) {
    try {
        const contents = await fs_1.default.promises.readFile(absoluteFilePath, 'utf8');
        return swiftModuleDefinitionRegex.test(contents);
    }
    catch {
        (0, console_1.warn)(`Swift inline module '${absoluteFilePath}' could not be opened.`);
        return false;
    }
}
/**
 * Scans the project and returns information about all of the inline modules inside in an InlineModulesMirror object.
 */
async function getMirrorStateObject(watchedDirectories, appRoot) {
    const inlineModulesMirror = {
        kotlinClasses: [],
        swiftModuleClassNames: [],
        files: [],
    };
    const taskInputs = [];
    for (const dir of watchedDirectories ?? []) {
        const absoluteDirPath = path_1.default.resolve(appRoot, dir);
        taskInputs.push(absoluteDirPath);
    }
    await (0, concurrency_1.taskAll)(taskInputs, async (absoluteDirPath) => {
        for await (const { name, path: filePath } of (0, utils_1.scanFilesRecursively)(absoluteDirPath)) {
            const { valid, ext } = inlineModuleFileNameInformation(name);
            if (!valid) {
                continue;
            }
            const absoluteFilePath = await (0, utils_1.maybeRealpath)(filePath);
            if (!absoluteFilePath) {
                continue;
            }
            const hasKotlinDefinition = ext === '.kt' && (await hasKotlinModuleDefinition(absoluteFilePath));
            const hasSwiftDefinition = ext === '.swift' && (await hasSwiftModuleDefinition(absoluteFilePath));
            if (hasKotlinDefinition) {
                const kotlinFileWithPackage = await getKotlinFileNameWithItsPackage(absoluteFilePath);
                if (kotlinFileWithPackage === null) {
                    continue;
                }
                inlineModulesMirror.kotlinClasses.push(kotlinFileWithPackage);
            }
            else if (hasSwiftDefinition) {
                const swiftClassName = getSwiftModuleClassName(absoluteFilePath);
                inlineModulesMirror.swiftModuleClassNames.push(swiftClassName);
            }
            inlineModulesMirror.files.push({
                filePath: absoluteFilePath,
                watchedDir: absoluteDirPath,
            });
        }
    });
    // Sort the kotlin and swift classes as later we want to use them to generate module providers and it's better to do it consistently for caching.
    inlineModulesMirror.kotlinClasses.sort();
    inlineModulesMirror.swiftModuleClassNames.sort();
    return inlineModulesMirror;
}
//# sourceMappingURL=inlineModules.js.map
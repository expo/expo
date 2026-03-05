"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inlineModuleFileNameInformation = inlineModuleFileNameInformation;
exports.getKotlinFileNameWithItsPackage = getKotlinFileNameWithItsPackage;
exports.getSwiftModuleClassName = getSwiftModuleClassName;
exports.getMirrorStateObject = getMirrorStateObject;
const console_1 = require("console");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const concurrency_1 = require("../concurrency");
const utils_1 = require("../utils");
const nativeExtensions = ['.kt', '.swift'];
/**
 * Checks if the fileName is valid for an inline module.
 * It needs to have suported extension and no dots in the basename as the basename has to match the module name.
 */
function inlineModuleFileNameInformation(fileName) {
    const ext = path_1.default.extname(fileName);
    if (!nativeExtensions.includes(ext)) {
        return { valid: false, ext };
    }
    const baseName = path_1.default.basename(fileName, ext);
    return { valid: !baseName.includes('.'), ext };
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
        for await (const { name, path } of (0, utils_1.scanFilesRecursively)(absoluteDirPath)) {
            const { valid, ext } = inlineModuleFileNameInformation(name);
            if (!valid) {
                continue;
            }
            const absoluteFilePath = await (0, utils_1.maybeRealpath)(path);
            if (!absoluteFilePath) {
                continue;
            }
            if (ext === '.kt') {
                const kotlinFileWithPackage = await getKotlinFileNameWithItsPackage(absoluteFilePath);
                if (kotlinFileWithPackage === null) {
                    continue;
                }
                inlineModulesMirror.kotlinClasses.push(kotlinFileWithPackage);
            }
            else {
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
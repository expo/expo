"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAppRoot = getAppRoot;
exports.getMirrorStateObject = getMirrorStateObject;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const concurrency_1 = require("../concurrency");
const utils_1 = require("../utils");
function findUpProjectRoot(cwd) {
    const packageJsonPath = path_1.default.resolve(cwd, './package.json');
    if (fs_1.default.existsSync(packageJsonPath)) {
        return path_1.default.dirname(packageJsonPath);
    }
    const parent = path_1.default.dirname(cwd);
    if (parent === cwd)
        return null;
    return findUpProjectRoot(parent);
}
/**
 * Finds the project root - the closest ancestor directory with package.json.
 * @returns path to the project root.
 */
async function getAppRoot() {
    const cwd = process.cwd();
    const result = findUpProjectRoot(cwd);
    if (!result) {
        throw new Error(`Couldn't find "package.json" up from path "${cwd}"`);
    }
    return result;
}
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
    const fileHandle = await fs_1.default.promises.open(absoluteFilePath, 'r');
    try {
        const { bytesRead } = await fileHandle.read(buffer, 0, HEADER_SIZE, 0);
        const header = buffer.toString('utf8', 0, bytesRead);
        // We want to find `package some.package` and capture the `some.package` from it.
        const pacakgeRegex = /^package\s+([\w.]+)/m;
        const packageMatch = header.match(pacakgeRegex);
        if (!packageMatch) {
            return '';
        }
        return `${packageMatch[1]}.${path_1.default.basename(absoluteFilePath, path_1.default.extname(absoluteFilePath))}`;
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
async function getMirrorStateObject(watchedDirectories) {
    const appRoot = await getAppRoot();
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
            inlineModulesMirror.files.push({
                filePath: absoluteFilePath,
                watchedDirRoot: absoluteDirPath,
            });
            if (ext === '.kt') {
                const kotlinFileWithPackage = await getKotlinFileNameWithItsPackage(absoluteFilePath);
                inlineModulesMirror.kotlinClasses.push(kotlinFileWithPackage);
            }
            else {
                const swiftClassName = getSwiftModuleClassName(absoluteFilePath);
                inlineModulesMirror.swiftModuleClassNames.push(swiftClassName);
            }
        }
    });
    // Sort the kotlin and swift classes as later we want to use them to generate module providers and it's better to do it consistently for caching.
    inlineModulesMirror.kotlinClasses.sort();
    inlineModulesMirror.swiftModuleClassNames.sort();
    return inlineModulesMirror;
}
//# sourceMappingURL=inlineModules.js.map
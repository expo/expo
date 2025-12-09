"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAppRoot = getAppRoot;
exports.getMirrorStateObject = getMirrorStateObject;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
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
async function getAppRoot() {
    const cwd = process.cwd();
    const result = findUpProjectRoot(cwd);
    if (!result) {
        throw new Error(`Couldn't find "package.json" up from path "${cwd}"`);
    }
    return result;
}
const nativeExtensions = ['.kt', '.swift'];
function isValidLocalModuleFileName(fileName) {
    let numberOfDots = 0;
    for (const character of fileName) {
        if (character === '.') {
            numberOfDots += 1;
        }
    }
    let hasNativeExtension = false;
    for (const extension of nativeExtensions) {
        if (fileName.endsWith(extension)) {
            hasNativeExtension = true;
            break;
        }
    }
    return hasNativeExtension && numberOfDots === 1;
}
function trimExtension(fileName) {
    return fileName.substring(0, fileName.lastIndexOf('.'));
}
function getKotlinFileNameWithItsPackage(absoluteFilePath) {
    const pacakgeRegex = /^package\s+/;
    const lines = fs_1.default.readFileSync(absoluteFilePath).toString().split('\n');
    const packageLine = lines.findIndex((line) => pacakgeRegex.test(line));
    if (packageLine < 0) {
        return '';
    }
    const packageName = lines[packageLine].substring('package '.length);
    return `${packageName}.${trimExtension(path_1.default.basename(absoluteFilePath))}`;
}
function getSwiftModuleClassName(absoluteFilePath) {
    return trimExtension(path_1.default.basename(absoluteFilePath));
}
async function getMirrorStateObject(watchedDirectories) {
    const appRoot = await getAppRoot();
    const inlineModulesMirror = {
        kotlinClasses: [],
        swiftModuleClassNames: [],
        files: [],
    };
    const recursivelyScanDirectory = async (absoluteDirPath, watchedDirRoot) => {
        const dir = fs_1.default.opendirSync(absoluteDirPath);
        for await (const dirent of dir) {
            const absoluteDirentPath = path_1.default.resolve(absoluteDirPath, dirent.name);
            if (dirent.isDirectory()) {
                await recursivelyScanDirectory(absoluteDirentPath, watchedDirRoot);
            }
            if (!dirent.isFile() || !isValidLocalModuleFileName(dirent.name)) {
                continue;
            }
            if (/\.(kt)$/.test(dirent.name)) {
                const kotlinFileWithPackage = getKotlinFileNameWithItsPackage(absoluteDirentPath);
                inlineModulesMirror.kotlinClasses.push(kotlinFileWithPackage);
                inlineModulesMirror.files.push({ filePath: absoluteDirentPath, watchedDirRoot });
            }
            else if (/\.(swift)$/.test(dirent.name)) {
                const swiftClassName = getSwiftModuleClassName(absoluteDirentPath);
                inlineModulesMirror.swiftModuleClassNames.push(swiftClassName);
                inlineModulesMirror.files.push({ filePath: absoluteDirentPath, watchedDirRoot });
            }
        }
    };
    for (const dir of watchedDirectories ?? []) {
        const absoluteDirPath = path_1.default.resolve(appRoot, dir);
        const watchedDirRoot = fs_1.default.realpathSync(path_1.default.resolve(appRoot, dir));
        await recursivelyScanDirectory(absoluteDirPath, watchedDirRoot);
    }
    return inlineModulesMirror;
}
//# sourceMappingURL=inlineModules.js.map
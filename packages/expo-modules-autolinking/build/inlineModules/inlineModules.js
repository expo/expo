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
function isValidInlineModuleFileName(fileName) {
    const ext = path_1.default.extname(fileName);
    if (!nativeExtensions.includes(ext)) {
        return false;
    }
    const baseName = path_1.default.basename(fileName, ext);
    return !baseName.includes('.');
}
function trimExtension(fileName) {
    return fileName.substring(0, fileName.lastIndexOf('.'));
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
        return `${packageMatch[1]}.${trimExtension(path_1.default.basename(absoluteFilePath))}`;
    }
    finally {
        await fileHandle.close();
    }
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
        const dir = await fs_1.default.promises.opendir(absoluteDirPath);
        for await (const dirent of dir) {
            const absoluteDirentPath = path_1.default.resolve(absoluteDirPath, dirent.name);
            if (dirent.isDirectory()) {
                await recursivelyScanDirectory(absoluteDirentPath, watchedDirRoot);
            }
            if (!dirent.isFile() || !isValidInlineModuleFileName(dirent.name)) {
                continue;
            }
            if (/\.(kt)$/.test(dirent.name)) {
                const kotlinFileWithPackage = await getKotlinFileNameWithItsPackage(absoluteDirentPath);
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
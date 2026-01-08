"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidInlineModuleFileName = isValidInlineModuleFileName;
exports.trimExtension = trimExtension;
exports.getProjectExcludePathsGlobs = getProjectExcludePathsGlobs;
exports.isFilePathExcluded = isFilePathExcluded;
exports.getMirrorDirectoriesPaths = getMirrorDirectoriesPaths;
exports.findUpPackageJsonDirectoryCached = findUpPackageJsonDirectoryCached;
exports.createFreshMirrorDirectories = createFreshMirrorDirectories;
exports.typesAndModulePathsForFile = typesAndModulePathsForFile;
exports.generateMirrorDirectories = generateMirrorDirectories;
exports.removeInlineModulesWatcherListener = removeInlineModulesWatcherListener;
exports.startInlineModulesMetroWatcherAsync = startInlineModulesMetroWatcherAsync;
const config_1 = require("@expo/config");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const nativeExtensions = ['.kt', '.swift'];
function isValidInlineModuleFileName(fileName) {
    return nativeExtensions.includes(path.extname(fileName));
}
function trimExtension(fileName) {
    const extensionStart = fileName.lastIndexOf('.');
    if (extensionStart >= 0) {
        return fileName.substring(0, extensionStart);
    }
    return fileName;
}
const EXCLUDE_GLOBS = [
    '.expo/**/*',
    'node_modules/**/*',
    'android/**/*',
    'ios/**/*',
    'modules/**/*',
];
function getProjectExcludePathsGlobs(projectRoot) {
    return EXCLUDE_GLOBS.map((glob) => path.resolve(projectRoot, glob));
}
function isFilePathExcluded(filePath, excludePathsGlobs) {
    for (const glob of excludePathsGlobs) {
        if (path.matchesGlob(filePath, glob)) {
            return true;
        }
    }
    return false;
}
function getMirrorDirectoriesPaths(dotExpoDir) {
    const inlineModulesPath = path.resolve(dotExpoDir, './inlineModules/');
    const inlineModulesModulesPath = path.resolve(inlineModulesPath, 'modules');
    const inlineModulesTypesPath = path.resolve(inlineModulesPath, 'types');
    return {
        inlineModulesModulesPath,
        inlineModulesTypesPath,
    };
}
function findUpPackageJsonDirectoryCached(cwd, directoryToPackage) {
    if (['.', path.sep].includes(cwd))
        return undefined;
    if (directoryToPackage.has(cwd))
        return directoryToPackage.get(cwd);
    const packageFound = fs.existsSync(path.resolve(cwd, './package.json'));
    if (packageFound) {
        directoryToPackage.set(cwd, cwd);
        return cwd;
    }
    const packageRoot = findUpPackageJsonDirectoryCached(path.dirname(cwd), directoryToPackage);
    if (packageRoot) {
        directoryToPackage.set(cwd, packageRoot);
    }
    return packageRoot;
}
async function createFreshMirrorDirectories(dotExpoDir) {
    const { inlineModulesModulesPath, inlineModulesTypesPath } = getMirrorDirectoriesPaths(dotExpoDir);
    const rmPromises = [];
    if (fs.existsSync(inlineModulesModulesPath)) {
        rmPromises.push(fs.promises.rm(inlineModulesModulesPath, { recursive: true, force: true }));
    }
    if (fs.existsSync(inlineModulesTypesPath)) {
        rmPromises.push(fs.promises.rm(inlineModulesTypesPath, { recursive: true, force: true }));
    }
    await Promise.all(rmPromises);
    await Promise.all([
        fs.promises.mkdir(inlineModulesModulesPath, { recursive: true }),
        fs.promises.mkdir(inlineModulesTypesPath, { recursive: true }),
    ]);
}
function typesAndModulePathsForFile(dotExpoDir, watchedDirRootAbsolutePath, absoluteFilePath, directoryToPackage) {
    const { inlineModulesModulesPath, inlineModulesTypesPath } = getMirrorDirectoriesPaths(dotExpoDir);
    const fileName = path.basename(absoluteFilePath);
    const moduleName = trimExtension(fileName);
    const watchedDirProjectRoot = findUpPackageJsonDirectoryCached(watchedDirRootAbsolutePath, directoryToPackage);
    if (!watchedDirProjectRoot) {
        throw Error('Watched directory is not inside a project with package.json!');
    }
    const filePathRelativeToTSProjectRoot = path.relative(watchedDirProjectRoot, absoluteFilePath);
    const filePathRelativeToTSProjectRootWithoutExtension = trimExtension(filePathRelativeToTSProjectRoot);
    const moduleTypesFilePath = path.resolve(inlineModulesTypesPath, filePathRelativeToTSProjectRootWithoutExtension + '.module.d.ts');
    const viewTypesFilePath = path.resolve(inlineModulesTypesPath, filePathRelativeToTSProjectRootWithoutExtension + '.view.d.ts');
    const moduleExportPath = path.resolve(inlineModulesModulesPath, filePathRelativeToTSProjectRootWithoutExtension + '.module.js');
    const viewExportPath = path.resolve(inlineModulesModulesPath, filePathRelativeToTSProjectRootWithoutExtension + '.view.js');
    return {
        moduleTypesFilePath,
        viewTypesFilePath,
        viewExportPath,
        moduleExportPath,
        moduleName,
    };
}
function fileWatchedWithAnyNativeExtension(absoluteFilePath, filesWatched) {
    const fileWithoutExtension = trimExtension(absoluteFilePath);
    for (const extension of nativeExtensions) {
        const fileToCheck = `${fileWithoutExtension}${extension}`;
        if (filesWatched.has(fileToCheck)) {
            return true;
        }
    }
    return false;
}
function getWatchedDirAncestorAbsolutePath(projectRoot, filePathAbsolute) {
    const watchedDirectories = (0, config_1.getConfig)(projectRoot).exp.experiments?.inlineModules?.watchedDirectories ?? [];
    const realRoot = path.resolve(projectRoot);
    for (const dir of watchedDirectories) {
        const dirPathAbsolute = path.resolve(realRoot, dir);
        if (filePathAbsolute.startsWith(dirPathAbsolute)) {
            return dirPathAbsolute;
        }
    }
    return null;
}
async function onSourceFileCreated(dotExpoDir, watchedDirRootAbsolutePath, absoluteFilePath, directoryToPackage, filesWatched) {
    const { moduleTypesFilePath, viewTypesFilePath, viewExportPath, moduleExportPath, moduleName } = typesAndModulePathsForFile(dotExpoDir, watchedDirRootAbsolutePath, absoluteFilePath, directoryToPackage);
    if (filesWatched && fileWatchedWithAnyNativeExtension(absoluteFilePath, filesWatched)) {
        filesWatched.add(absoluteFilePath);
        return;
    }
    if (filesWatched) {
        filesWatched.add(absoluteFilePath);
    }
    await Promise.all([
        fs.promises.mkdir(path.dirname(moduleExportPath), { recursive: true }),
        fs.promises.mkdir(path.dirname(moduleTypesFilePath), { recursive: true }),
    ]);
    const writeFilePromises = [];
    if (!fs.existsSync(viewExportPath)) {
        writeFilePromises.push(fs.promises.writeFile(viewExportPath, `import { requireNativeView } from 'expo';
export default requireNativeView("${moduleName}");`));
    }
    if (!fs.existsSync(moduleExportPath)) {
        writeFilePromises.push(fs.promises.writeFile(moduleExportPath, `import { requireNativeModule } from 'expo';
export default requireNativeModule("${moduleName}");`));
    }
    if (!fs.existsSync(viewTypesFilePath)) {
        fs.promises.writeFile(viewTypesFilePath, `import React from "react"
const _default: React.JSX.ElementType
export default _default`);
    }
    if (!fs.existsSync(moduleTypesFilePath)) {
        fs.promises.writeFile(moduleTypesFilePath, `const _default: any
export default _default`);
    }
    await Promise.all(writeFilePromises);
}
async function generateMirrorDirectories(projectRoot, filesWatched, directoryToPackage = new Map()) {
    const dotExpoDir = path.resolve(projectRoot, '.expo');
    await createFreshMirrorDirectories(dotExpoDir);
    const generateExportsAndTypesForDirectory = async (absoluteDirPath, watchedDirRootAbsolutePath) => {
        if (isFilePathExcluded(absoluteDirPath, getProjectExcludePathsGlobs(projectRoot))) {
            return;
        }
        const dir = await fs.promises.opendir(absoluteDirPath);
        for await (const dirent of dir) {
            const absoluteDirentPath = path.resolve(absoluteDirPath, dirent.name);
            if (dirent.isFile() &&
                isValidInlineModuleFileName(dirent.name) &&
                absoluteDirentPath.startsWith(watchedDirRootAbsolutePath)) {
                await onSourceFileCreated(dotExpoDir, watchedDirRootAbsolutePath, absoluteDirentPath, directoryToPackage, filesWatched);
            }
            else if (dirent.isDirectory()) {
                await generateExportsAndTypesForDirectory(absoluteDirentPath, watchedDirRootAbsolutePath);
            }
        }
    };
    const watchedDirectories = (0, config_1.getConfig)(projectRoot).exp.experiments?.inlineModules?.watchedDirectories ?? [];
    for (const watchedDirectory of watchedDirectories) {
        await generateExportsAndTypesForDirectory(path.resolve(projectRoot, watchedDirectory), await fs.promises.realpath(watchedDirectory));
    }
}
let inlineModulesWatcherListener = null;
function removeInlineModulesWatcherListener(metro) {
    if (inlineModulesWatcherListener) {
        metro
            .getBundler()
            .getBundler()
            .getWatcher()
            .removeListener('change', inlineModulesWatcherListener);
    }
}
async function startInlineModulesMetroWatcherAsync({ projectRoot, metro }, filesWatched = new Set(), directoryToPackage = new Map()) {
    const dotExpoDir = path.resolve(projectRoot, '.expo');
    const removeFileAndEmptyDirectories = async (absoluteFilePath) => {
        await fs.promises.rm(absoluteFilePath);
        let dirNow = path.dirname(absoluteFilePath);
        while ((await fs.promises.readdir(dirNow)).length === 0 && dirNow !== dotExpoDir) {
            await fs.promises.rmdir(dirNow);
            dirNow = path.dirname(dirNow);
        }
    };
    const onSourceFileRemoved = async (absoluteFilePath, watchedDirRootAbsolutePath) => {
        const { moduleTypesFilePath, moduleExportPath, viewExportPath, viewTypesFilePath } = typesAndModulePathsForFile(dotExpoDir, watchedDirRootAbsolutePath, absoluteFilePath, directoryToPackage);
        filesWatched.delete(absoluteFilePath);
        if (!fileWatchedWithAnyNativeExtension(absoluteFilePath, filesWatched)) {
            await Promise.all([
                removeFileAndEmptyDirectories(moduleTypesFilePath),
                removeFileAndEmptyDirectories(moduleExportPath),
                removeFileAndEmptyDirectories(viewExportPath),
                removeFileAndEmptyDirectories(viewTypesFilePath),
            ]);
        }
    };
    const watcher = metro?.getBundler().getBundler().getWatcher();
    const eventTypes = ['add', 'delete'];
    const excludePathsGlobs = getProjectExcludePathsGlobs(projectRoot);
    const isWatchedFileEvent = (event, watchedDirAncestor) => {
        return (isValidInlineModuleFileName(path.basename(event.filePath)) &&
            !isFilePathExcluded(event.filePath, excludePathsGlobs) &&
            !!watchedDirAncestor);
    };
    const listener = async ({ eventsQueue }) => {
        for (const event of eventsQueue) {
            const watchedDirAncestor = getWatchedDirAncestorAbsolutePath(projectRoot, path.resolve(event.filePath));
            if (eventTypes.includes(event.type) &&
                isWatchedFileEvent(event, watchedDirAncestor) &&
                !!watchedDirAncestor) {
                const { filePath } = event;
                if (event.type === 'add') {
                    await onSourceFileCreated(dotExpoDir, watchedDirAncestor, filePath, directoryToPackage, filesWatched);
                }
                else if (event.type === 'delete') {
                    await onSourceFileRemoved(filePath, watchedDirAncestor);
                }
            }
        }
    };
    inlineModulesWatcherListener = listener;
    watcher?.addListener('change', listener);
}

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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExpoPlistPath = exports.getSupportingPath = exports.getEntitlementsPath = exports.getAllEntitlementsPaths = exports.getInfoPlistPath = exports.getAllInfoPlistPaths = exports.getPBXProjectPath = exports.getAllPBXProjectPaths = exports.getXcodeProjectPath = exports.getAllXcodeProjectPaths = exports.findSchemeNames = exports.findSchemePaths = exports.getSourceRoot = exports.getAppDelegate = exports.getFileInfo = exports.getAppDelegateObjcHeaderFilePath = exports.getAppDelegateFilePath = exports.getAppDelegateHeaderFilePath = void 0;
const fs_1 = require("fs");
const glob_1 = require("glob");
const path = __importStar(require("path"));
const Entitlements = __importStar(require("./Entitlements"));
const errors_1 = require("../utils/errors");
const warnings_1 = require("../utils/warnings");
const ignoredPaths = ['**/@(Carthage|Pods|vendor|node_modules)/**'];
function getAppDelegateHeaderFilePath(projectRoot) {
    const [using, ...extra] = (0, glob_1.sync)('ios/*/AppDelegate.h', {
        absolute: true,
        cwd: projectRoot,
        ignore: ignoredPaths,
    });
    if (!using) {
        throw new errors_1.UnexpectedError(`Could not locate a valid AppDelegate header at root: "${projectRoot}"`);
    }
    if (extra.length) {
        warnMultipleFiles({
            tag: 'app-delegate-header',
            fileName: 'AppDelegate',
            projectRoot,
            using,
            extra,
        });
    }
    return using;
}
exports.getAppDelegateHeaderFilePath = getAppDelegateHeaderFilePath;
function getAppDelegateFilePath(projectRoot) {
    const [using, ...extra] = (0, glob_1.sync)('ios/*/AppDelegate.@(m|mm|swift)', {
        absolute: true,
        cwd: projectRoot,
        ignore: ignoredPaths,
    });
    if (!using) {
        throw new errors_1.UnexpectedError(`Could not locate a valid AppDelegate at root: "${projectRoot}"`);
    }
    if (extra.length) {
        warnMultipleFiles({
            tag: 'app-delegate',
            fileName: 'AppDelegate',
            projectRoot,
            using,
            extra,
        });
    }
    return using;
}
exports.getAppDelegateFilePath = getAppDelegateFilePath;
function getAppDelegateObjcHeaderFilePath(projectRoot) {
    const [using, ...extra] = (0, glob_1.sync)('ios/*/AppDelegate.h', {
        absolute: true,
        cwd: projectRoot,
        ignore: ignoredPaths,
    });
    if (!using) {
        throw new errors_1.UnexpectedError(`Could not locate a valid AppDelegate.h at root: "${projectRoot}"`);
    }
    if (extra.length) {
        warnMultipleFiles({
            tag: 'app-delegate-objc-header',
            fileName: 'AppDelegate.h',
            projectRoot,
            using,
            extra,
        });
    }
    return using;
}
exports.getAppDelegateObjcHeaderFilePath = getAppDelegateObjcHeaderFilePath;
function getLanguage(filePath) {
    const extension = path.extname(filePath);
    switch (extension) {
        case '.mm':
            return 'objcpp';
        case '.m':
        case '.h':
            return 'objc';
        case '.swift':
            return 'swift';
        default:
            throw new errors_1.UnexpectedError(`Unexpected iOS file extension: ${extension}`);
    }
}
function getFileInfo(filePath) {
    return {
        path: path.normalize(filePath),
        contents: (0, fs_1.readFileSync)(filePath, 'utf8'),
        language: getLanguage(filePath),
    };
}
exports.getFileInfo = getFileInfo;
function getAppDelegate(projectRoot) {
    const filePath = getAppDelegateFilePath(projectRoot);
    return getFileInfo(filePath);
}
exports.getAppDelegate = getAppDelegate;
function getSourceRoot(projectRoot) {
    const appDelegate = getAppDelegate(projectRoot);
    return path.dirname(appDelegate.path);
}
exports.getSourceRoot = getSourceRoot;
function findSchemePaths(projectRoot) {
    return (0, glob_1.sync)('ios/*.xcodeproj/xcshareddata/xcschemes/*.xcscheme', {
        absolute: true,
        cwd: projectRoot,
        ignore: ignoredPaths,
    });
}
exports.findSchemePaths = findSchemePaths;
function findSchemeNames(projectRoot) {
    const schemePaths = findSchemePaths(projectRoot);
    return schemePaths.map((schemePath) => path.parse(schemePath).name);
}
exports.findSchemeNames = findSchemeNames;
function getAllXcodeProjectPaths(projectRoot) {
    const iosFolder = 'ios';
    const pbxprojPaths = (0, glob_1.sync)('ios/**/*.xcodeproj', { cwd: projectRoot, ignore: ignoredPaths })
        .filter((project) => !/test|example|sample/i.test(project) || path.dirname(project) === iosFolder)
        // sort alphabetically to ensure this works the same across different devices (Fail in CI (linux) without this)
        .sort()
        .sort((a, b) => {
        const isAInIos = path.dirname(a) === iosFolder;
        const isBInIos = path.dirname(b) === iosFolder;
        // preserve previous sort order
        if ((isAInIos && isBInIos) || (!isAInIos && !isBInIos)) {
            return 0;
        }
        return isAInIos ? -1 : 1;
    });
    if (!pbxprojPaths.length) {
        throw new errors_1.UnexpectedError(`Failed to locate the ios/*.xcodeproj files relative to path "${projectRoot}".`);
    }
    return pbxprojPaths.map((value) => path.join(projectRoot, value));
}
exports.getAllXcodeProjectPaths = getAllXcodeProjectPaths;
/**
 * Get the pbxproj for the given path
 */
function getXcodeProjectPath(projectRoot) {
    const [using, ...extra] = getAllXcodeProjectPaths(projectRoot);
    if (extra.length) {
        warnMultipleFiles({
            tag: 'xcodeproj',
            fileName: '*.xcodeproj',
            projectRoot,
            using,
            extra,
        });
    }
    return using;
}
exports.getXcodeProjectPath = getXcodeProjectPath;
function getAllPBXProjectPaths(projectRoot) {
    const projectPaths = getAllXcodeProjectPaths(projectRoot);
    const paths = projectPaths
        .map((value) => path.join(value, 'project.pbxproj'))
        .filter((value) => (0, fs_1.existsSync)(value));
    if (!paths.length) {
        throw new errors_1.UnexpectedError(`Failed to locate the ios/*.xcodeproj/project.pbxproj files relative to path "${projectRoot}".`);
    }
    return paths;
}
exports.getAllPBXProjectPaths = getAllPBXProjectPaths;
function getPBXProjectPath(projectRoot) {
    const [using, ...extra] = getAllPBXProjectPaths(projectRoot);
    if (extra.length) {
        warnMultipleFiles({
            tag: 'project-pbxproj',
            fileName: 'project.pbxproj',
            projectRoot,
            using,
            extra,
        });
    }
    return using;
}
exports.getPBXProjectPath = getPBXProjectPath;
function getAllInfoPlistPaths(projectRoot) {
    const paths = (0, glob_1.sync)('ios/*/Info.plist', {
        absolute: true,
        cwd: projectRoot,
        ignore: ignoredPaths,
    }).sort(
    // longer name means more suffixes, we want the shortest possible one to be first.
    (a, b) => a.length - b.length);
    if (!paths.length) {
        throw new errors_1.UnexpectedError(`Failed to locate Info.plist files relative to path "${projectRoot}".`);
    }
    return paths;
}
exports.getAllInfoPlistPaths = getAllInfoPlistPaths;
function getInfoPlistPath(projectRoot) {
    const [using, ...extra] = getAllInfoPlistPaths(projectRoot);
    if (extra.length) {
        warnMultipleFiles({
            tag: 'info-plist',
            fileName: 'Info.plist',
            projectRoot,
            using,
            extra,
        });
    }
    return using;
}
exports.getInfoPlistPath = getInfoPlistPath;
function getAllEntitlementsPaths(projectRoot) {
    const paths = (0, glob_1.sync)('ios/*/*.entitlements', {
        absolute: true,
        cwd: projectRoot,
        ignore: ignoredPaths,
    });
    return paths;
}
exports.getAllEntitlementsPaths = getAllEntitlementsPaths;
/**
 * @deprecated: use Entitlements.getEntitlementsPath instead
 */
function getEntitlementsPath(projectRoot) {
    return Entitlements.getEntitlementsPath(projectRoot);
}
exports.getEntitlementsPath = getEntitlementsPath;
function getSupportingPath(projectRoot) {
    return path.resolve(projectRoot, 'ios', path.basename(getSourceRoot(projectRoot)), 'Supporting');
}
exports.getSupportingPath = getSupportingPath;
function getExpoPlistPath(projectRoot) {
    const supportingPath = getSupportingPath(projectRoot);
    return path.join(supportingPath, 'Expo.plist');
}
exports.getExpoPlistPath = getExpoPlistPath;
function warnMultipleFiles({ tag, fileName, projectRoot, using, extra, }) {
    const usingPath = projectRoot ? path.relative(projectRoot, using) : using;
    const extraPaths = projectRoot ? extra.map((v) => path.relative(projectRoot, v)) : extra;
    (0, warnings_1.addWarningIOS)(`paths-${tag}`, `Found multiple ${fileName} file paths, using "${usingPath}". Ignored paths: ${JSON.stringify(extraPaths)}`);
}

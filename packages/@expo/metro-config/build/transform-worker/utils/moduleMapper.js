"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStickyModuleMapper = exports.moduleRootPaths = void 0;
const path_1 = __importDefault(require("path"));
exports.moduleRootPaths = [
    path_1.default.dirname(require.resolve('../../../package.json')),
    path_1.default.dirname(require.resolve('@expo/metro/package.json')),
    path_1.default.dirname(require.resolve('expo/package.json')),
];
const escapeDependencyName = (dependency) => dependency.replace(/[*.?()[\]]/g, (x) => `\\${x}`);
const dependenciesToRegex = (dependencies) => new RegExp(`^(${dependencies.map(escapeDependencyName).join('|')})($|/.*)`);
const isInModuleRootPath = (targetPath) => exports.moduleRootPaths.some((moduleRootPath) => targetPath.startsWith(moduleRootPath));
const createStickyModuleMapper = (moduleNames) => {
    const modulePathMap = moduleNames.reduce((modulePaths, moduleName) => {
        try {
            modulePaths[moduleName] = path_1.default.dirname(require.resolve(`${moduleName}/package.json`, { paths: exports.moduleRootPaths }));
        }
        catch { }
        return modulePaths;
    }, {});
    const moduleTestRe = dependenciesToRegex(Object.keys(modulePathMap));
    return (request, parentId) => {
        if (!parentId || isInModuleRootPath(parentId)) {
            return null;
        }
        const moduleMatch = moduleTestRe.exec(request);
        if (moduleMatch) {
            const targetModulePath = modulePathMap[moduleMatch[1]];
            if (targetModulePath) {
                return `${targetModulePath}${moduleMatch[2] || ''}`;
            }
        }
        return null;
    };
};
exports.createStickyModuleMapper = createStickyModuleMapper;
//# sourceMappingURL=moduleMapper.js.map
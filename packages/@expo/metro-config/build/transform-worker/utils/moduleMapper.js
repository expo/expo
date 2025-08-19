"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStickyModuleMapper = void 0;
const path_1 = __importDefault(require("path"));
const requireResolveBasepath = (request, params) => path_1.default.dirname(require.resolve(`${request}/package.json`, params));
const expoMetroBasepath = requireResolveBasepath('@expo/metro');
const MODULE_RESOLUTIONS = {
    metro: expoMetroBasepath,
    'metro-babel-transformer': expoMetroBasepath,
    'metro-cache': expoMetroBasepath,
    'metro-cache-key': expoMetroBasepath,
    'metro-config': expoMetroBasepath,
    'metro-core': expoMetroBasepath,
    'metro-file-map': expoMetroBasepath,
    'metro-resolver': expoMetroBasepath,
    'metro-runtime': expoMetroBasepath,
    'metro-source-map': expoMetroBasepath,
    'metro-transform-plugins': expoMetroBasepath,
    'metro-transform-worker': expoMetroBasepath,
    '@expo/metro-config': requireResolveBasepath('expo'),
};
const escapeDependencyName = (dependency) => dependency.replace(/[*.?()[\]]/g, (x) => `\\${x}`);
const dependenciesToRegex = (dependencies) => new RegExp(`^(${dependencies.map(escapeDependencyName).join('|')})($|/.*)`);
const createStickyModuleMapper = () => {
    const moduleTestRe = dependenciesToRegex(Object.keys(MODULE_RESOLUTIONS));
    return (request, parentId) => {
        if (!parentId) {
            return null;
        }
        const moduleMatch = moduleTestRe.exec(request);
        if (moduleMatch) {
            const moduleSearchPath = MODULE_RESOLUTIONS[moduleMatch[1]];
            if (moduleSearchPath) {
                return require.resolve(request, { paths: [moduleSearchPath] });
            }
        }
        return null;
    };
};
exports.createStickyModuleMapper = createStickyModuleMapper;
//# sourceMappingURL=moduleMapper.js.map
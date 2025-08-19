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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transform = transform;
const module_1 = __importDefault(require("module"));
const path_1 = __importDefault(require("path"));
const worker = __importStar(require("./metro-transform-worker"));
const defaultTransformer = require('./transform-worker');
const STICKY_PACKAGES = [
    'metro-transform-worker',
    'metro-babel-transformer',
    'metro',
    '@expo/metro-config',
    '@expo/metro',
];
const debug = require('debug')('expo:metro-config:supervising-transform-worker');
const escapeDependencyName = (dependency) => dependency.replace(/[*.?()[\]]/g, (x) => `\\${x}`);
const dependenciesToRegex = (dependencies) => new RegExp(`^(${dependencies.map(escapeDependencyName).join('|')})($|/.*)`);
const moduleRootPaths = [
    path_1.default.dirname(require.resolve('../../package.json')),
    path_1.default.dirname(require.resolve('@expo/metro/package.json')),
    path_1.default.dirname(require.resolve('expo/package.json')),
];
const createStickyModuleMapper = (moduleNames) => {
    const modulePathMap = moduleNames.reduce((modulePaths, moduleName) => {
        try {
            modulePaths[moduleName] = path_1.default.dirname(require.resolve(`${moduleName}/package.json`, { paths: moduleRootPaths }));
        }
        catch {
            debug(`Could not resolve module "${moduleNames}"`);
        }
        return modulePaths;
    }, {});
    const moduleTestRe = dependenciesToRegex(Object.keys(modulePathMap));
    return (request) => {
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
let _initModuleInterceptDone = false;
const initModuleIntercept = (moduleNames) => {
    if (_initModuleInterceptDone) {
        return;
    }
    _initModuleInterceptDone = true;
    const Module = module.constructor.length > 1 ? module.constructor : module_1.default;
    const originalResolveFilename = Module._resolveFilename;
    const stickyModuleMapper = createStickyModuleMapper(moduleNames);
    Module._resolveFilename = function (request, parent, isMain, options) {
        const parentId = typeof parent === 'string' ? parent : parent?.id;
        if (!parentId ||
            moduleRootPaths.every((moduleRootPath) => !parentId.startsWith(moduleRootPath))) {
            const redirectedRequest = stickyModuleMapper(request);
            if (redirectedRequest) {
                try {
                    const resolution = require.resolve(redirectedRequest);
                    debug(`Redirected request "${request}" -> "${redirectedRequest}"`);
                    return resolution;
                }
                catch (error) {
                    debug(`Could not redirect request "${request}": ${error}`);
                }
            }
        }
        return originalResolveFilename.call(this, request, parent, isMain, options);
    };
};
const getCustomTransform = (() => {
    let _transformerPath;
    let _transformer;
    return (config) => {
        if (_transformer == null && _transformerPath == null) {
            _transformerPath = config.expo_customTransformerPath;
        }
        else if (config.expo_customTransformerPath != null &&
            _transformerPath !== config.expo_customTransformerPath) {
            throw new Error('expo_customTransformerPath must not be modified after initialization');
        }
        initModuleIntercept(STICKY_PACKAGES);
        if (_transformer == null && _transformerPath != null) {
            debug(`Loading custom transformer at "${_transformerPath}"`);
            try {
                _transformer = require.call(null, _transformerPath);
            }
            catch (error) {
                throw new Error(`Your custom Metro transformer has failed to initialize. Check: "${_transformerPath}"\n` +
                    (typeof error.message === 'string' ? error.message : `${error}`));
            }
        }
        return _transformer;
    };
})();
const removeCustomTransformPathFromConfig = (config) => {
    if (config.expo_customTransformerPath != null) {
        config.expo_customTransformerPath = undefined;
    }
};
function transform(config, projectRoot, filename, data, options) {
    const customWorker = getCustomTransform(config) ?? defaultTransformer;
    removeCustomTransformPathFromConfig(config);
    return customWorker.transform(config, projectRoot, filename, data, options);
}
module.exports = {
    // Use defaults for everything that's not custom.
    ...worker,
    // We ensure that core utilities are never replaced
    applyImportSupport: worker.applyImportSupport,
    getCacheKey: worker.getCacheKey,
    collectDependenciesForShaking: worker.collectDependenciesForShaking,
    minifyCode: worker.minifyCode,
    transform,
};
//# sourceMappingURL=supervising-transform-worker.js.map
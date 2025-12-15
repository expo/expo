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
const path_1 = __importDefault(require("path"));
const worker = __importStar(require("./metro-transform-worker"));
const moduleMapper_1 = require("./utils/moduleMapper");
const defaultTransformer = require('./transform-worker');
const defaultTransformerPath = require.resolve('./transform-worker');
const debug = require('debug')('expo:metro-config:supervising-transform-worker');
const getCustomTransform = (() => {
    let _transformerPath;
    let _transformer;
    return (config, projectRoot) => {
        // The user's original `transformerPath` is stored on `config.transformer.expo_customTransformerPath`
        // by @expo/cli in `withMetroSupervisingTransformWorker()`
        if (_transformer == null && _transformerPath == null) {
            _transformerPath = config.expo_customTransformerPath;
        }
        else if (config.expo_customTransformerPath != null &&
            _transformerPath !== config.expo_customTransformerPath) {
            throw new Error('expo_customTransformerPath must not be modified after initialization');
        }
        // We override require calls in the user transformer to use *our* version
        // of Metro and this version of @expo/metro-config forcefully.
        // Versions of Metro must be aligned to the ones that Expo is using
        // This is done by patching Node.js' module resolution function
        (0, moduleMapper_1.patchNodeModuleResolver)();
        if (_transformer == null &&
            _transformerPath != null &&
            _transformerPath !== defaultTransformerPath) {
            // We only load the user transformer once and cache it
            // If the user didn't add a custom transformer, we don't load it,
            // but the user maybe has a custom Babel transformer
            debug(`Loading custom transformer at "${_transformerPath}"`);
            try {
                _transformer = require.call(null, _transformerPath);
            }
            catch (error) {
                // If the user's transformer throws and fails initialization, we customize the
                // error and output a path to the user to clarify that it's the transformer that
                // failed to initialize
                const relativeTransformerPath = path_1.default.relative(projectRoot, _transformerPath);
                throw new Error(`Your custom Metro transformer has failed to initialize. Check: "${relativeTransformerPath}"\n` +
                    (typeof error.message === 'string' ? error.message : `${error}`));
            }
        }
        return _transformer;
    };
})();
function transform(config, projectRoot, filename, data, options) {
    const customWorker = getCustomTransform(config, projectRoot) ?? defaultTransformer;
    // Delete this custom property before we call the custom transform worker
    // The supervising-transform-worker should be transparent, and the user's transformer
    // shouldn't know it's been called by it
    if (config.expo_customTransformerPath != null) {
        config.expo_customTransformerPath = undefined;
    }
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
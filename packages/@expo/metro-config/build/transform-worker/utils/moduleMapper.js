"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchNodeModuleResolver = exports.createModuleMapper = void 0;
const module_1 = __importDefault(require("module"));
const path_1 = __importDefault(require("path"));
const debug = require('debug')('expo:metro-config:supervising-transform-worker:module-mapper');
const requireResolveBasepath = (request, params) => path_1.default.dirname(require.resolve(`${request}/package.json`, params));
const expoMetroBasepath = requireResolveBasepath('@expo/metro');
/** Modules that should be mapped to a different resolution path.
 * @remarks
 * This defines a list of packages we want to remap and their destinations.
 * For each entry, the key is the module resolution to redirect, and the
 * value is the path to resolve from.
 * `createModuleMapper()` resolves these modules as if we were requiring
 * them from the paths below.
 *
 * For example, for `expoMetroBasepath`, we're
 * requiring this module as if we were inside `@expo/metro`.
 *
 * This means we'll always get that path's dependency.
 */
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
/** Returns a resolver function that given a request to a module returns that module's remapped path. */
const createModuleMapper = () => {
    // Matches only module names, inside `MODULE_RESOLUTIONS`
    const moduleTestRe = dependenciesToRegex(Object.keys(MODULE_RESOLUTIONS));
    return (request) => {
        const moduleMatch = moduleTestRe.exec(request);
        if (moduleMatch) {
            // If the request is for a package in `MODULE_RESOLUTIONS`, we use
            // the value in `MODULE_RESOLUTIONS` as a require path
            const moduleSearchPath = MODULE_RESOLUTIONS[moduleMatch[1]];
            if (moduleSearchPath) {
                // Resolve the dependency request from `moduleSearchPath` instead of
                // the transformer's own path
                return require.resolve(request, { paths: [moduleSearchPath] });
            }
        }
        return null;
    };
};
exports.createModuleMapper = createModuleMapper;
/** Checks if we're either in a worker thread or a child process */
const isInForkedProcess = () => !require('worker_threads').isMainThread || typeof process.send === 'function';
let hasPatchedNodeModuleResolver = false;
/** Patches `Module._resolveFilename` (usually just does Node resolution) to override some requires and imports
 * @remarks
 * The user's transform worker (or their babel transformer, which is called inside the transform-worker) can
 * import/require any version of metro, metro-*, or @expo/metro-config in theory. But Expo CLI uses a specific
 * version of Metro.
 * It's unsupported to use one version of Metro in Expo CLI but another in the transform worker or babel transformer,
 * and while this *can work* sometimes, it's never correct.
 *
 * When called, this function modifies this Node.js thread's module resolution to redirect all imports for Metro
 * packages or @expo/metro-config to the version that we know is correct.
 *
 * We know the versions we have are correct since we're inside @expo/metro-config in this file.
 *
 * NOTE: Bun also supports overriding `Module._resolveFilename`
 */
const patchNodeModuleResolver = () => {
    if (hasPatchedNodeModuleResolver) {
        return;
    }
    else if (!isInForkedProcess()) {
        // If max-workers=0 is set for Metro, we will be transforming in the
        // main thread (same thread as @expo/cli and Metro).
        // We should not patch Module._resolveFilename if we're not in a
        // separate Node.js thread to prevent `@expo/cli`'s imports from
        // being manipulated. This is dangerous and it'd get hard to
        // predict what would happen
        debug('Module interception disabled: Not in a child process!');
    }
    hasPatchedNodeModuleResolver = true;
    const moduleMapper = (0, exports.createModuleMapper)();
    // NOTE: Guard against mocks, see: https://github.com/danez/pirates/blob/5a81f70/lib/index.js#L8-L10
    const Module = module.constructor.length > 1 ? module.constructor : module_1.default;
    const originalResolveFilename = Module._resolveFilename;
    let isInCustomResolver = false;
    Module._resolveFilename = function (request, parent, isMain, options) {
        if (!isInCustomResolver) {
            try {
                isInCustomResolver = true;
                const parentId = typeof parent === 'string' ? parent : parent?.id;
                if (parentId) {
                    // If the `transform-worker` requests a module in `MODULE_RESOLUTIONS`,
                    // we redirect the request to a different resolution path
                    // This path is based on requiring as if we're in a different module
                    // For example,
                    // 1. the user's transform-worker imports `metro-transform-worker`
                    // 2. this matches in `moduleMapper` and we get a replacement path
                    // 3. we return this redirect path here
                    // 4. the user's transform-worker now imports `metro-transform-worker` from `@expo/metro`'s dependencies instead
                    const redirectedRequest = moduleMapper(request);
                    if (redirectedRequest) {
                        debug(`Redirected request "${request}" -> "${redirectedRequest}"`);
                        return redirectedRequest;
                    }
                }
            }
            catch (error) {
                debug(`Could not redirect request "${request}": ${error}`);
            }
            finally {
                // This guards against infinite recursion
                isInCustomResolver = false;
            }
        }
        return originalResolveFilename.call(this, request, parent, isMain, options);
    };
};
exports.patchNodeModuleResolver = patchNodeModuleResolver;
//# sourceMappingURL=moduleMapper.js.map
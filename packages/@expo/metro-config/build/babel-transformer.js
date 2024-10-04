"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_assert_1 = __importDefault(require("node:assert"));
const node_crypto_1 = __importDefault(require("node:crypto"));
const node_fs_1 = __importDefault(require("node:fs"));
const loadBabelConfig_1 = require("./loadBabelConfig");
const transformSync_1 = require("./transformSync");
const cacheKeyParts = [
    node_fs_1.default.readFileSync(__filename),
    require('babel-preset-fbjs/package.json').version,
];
function isCustomTruthy(value) {
    return value === true || value === 'true';
}
function memoize(fn) {
    const cache = new Map();
    return ((...args) => {
        const key = JSON.stringify(args);
        if (cache.has(key)) {
            return cache.get(key);
        }
        const result = fn(...args);
        cache.set(key, result);
        return result;
    });
}
const memoizeWarning = memoize((message) => {
    console.warn(message);
});
function getBabelCaller({ filename, options }) {
    const isNodeModule = filename.includes('node_modules');
    const isServer = options.customTransformOptions?.environment === 'node';
    const routerRoot = typeof options.customTransformOptions?.routerRoot === 'string'
        ? decodeURI(options.customTransformOptions.routerRoot)
        : undefined;
    if (routerRoot == null) {
        memoizeWarning('Missing transform.routerRoot option in Metro bundling request, falling back to `app` as routes directory.');
    }
    return {
        name: 'metro',
        bundler: 'metro',
        platform: options.platform,
        // Empower the babel preset to know the env it's bundling for.
        // Metro automatically updates the cache to account for the custom transform options.
        isServer,
        // The base url to make requests from, used for hosting from non-standard locations.
        baseUrl: typeof options.customTransformOptions?.baseUrl === 'string'
            ? decodeURI(options.customTransformOptions.baseUrl)
            : '',
        // Ensure we always use a mostly-valid router root.
        routerRoot: routerRoot ?? 'app',
        isDev: options.dev,
        // This value indicates if the user has disabled the feature or not.
        // Other criteria may still cause the feature to be disabled, but all inputs used are
        // already considered in the cache key.
        preserveEnvVars: isCustomTruthy(options.customTransformOptions?.preserveEnvVars)
            ? true
            : undefined,
        asyncRoutes: isCustomTruthy(options.customTransformOptions?.asyncRoutes) ? true : undefined,
        // Pass the engine to babel so we can automatically transpile for the correct
        // target environment.
        engine: options.customTransformOptions?.engine,
        // Provide the project root for accurately reading the Expo config.
        projectRoot: options.projectRoot,
        isNodeModule,
        isHMREnabled: options.hot,
        // Set the standard Babel flag to disable ESM transformations.
        supportsStaticESM: options.experimentalImportSupport,
    };
}
const transform = ({ filename, src, options, 
// `plugins` is used for `functionMapBabelPlugin` from `metro-source-map`. Could make sense to move this to `babel-preset-expo` too.
plugins, }) => {
    const OLD_BABEL_ENV = process.env.BABEL_ENV;
    process.env.BABEL_ENV = options.dev ? 'development' : process.env.BABEL_ENV || 'production';
    try {
        const babelConfig = {
            // ES modules require sourceType='module' but OSS may not always want that
            sourceType: 'unambiguous',
            // The output we want from Babel methods
            ast: true,
            code: false,
            // NOTE(EvanBacon): We split the parse/transform steps up to accommodate
            // Hermes parsing, but this defaults to cloning the AST which increases
            // the transformation time by a fair amount.
            // You get this behavior by default when using Babel's `transform` method directly.
            cloneInputAst: false,
            // Options for debugging
            cwd: options.projectRoot,
            filename,
            highlightCode: true,
            // Load the project babel config file.
            ...(0, loadBabelConfig_1.loadBabelConfig)(options),
            babelrc: typeof options.enableBabelRCLookup === 'boolean' ? options.enableBabelRCLookup : true,
            plugins,
            // NOTE(EvanBacon): We heavily leverage the caller functionality to mutate the babel config.
            // This compensates for the lack of a format plugin system in Metro. Users can modify the
            // all (most) of the transforms in their local Babel config.
            // This also helps us keep the transform layers small and focused on a single task. We can also use this to
            // ensure the Babel config caching is more accurate.
            // Additionally, by moving everything Babel-related to the Babel preset, it makes it easier for users to reason
            // about the requirements of an Expo project, making it easier to migrate to other transpilers in the future.
            caller: getBabelCaller({ filename, options }),
        };
        const result = (0, transformSync_1.transformSync)(src, babelConfig, options);
        // The result from `transformFromAstSync` can be null (if the file is ignored)
        if (!result) {
            // BabelTransformer specifies that the `ast` can never be null but
            // the function returns here. Discovered when typing `BabelNode`.
            return { ast: null };
        }
        (0, node_assert_1.default)(result.ast);
        return { ast: result.ast, metadata: result.metadata };
    }
    finally {
        if (OLD_BABEL_ENV) {
            process.env.BABEL_ENV = OLD_BABEL_ENV;
        }
    }
};
function getCacheKey() {
    const key = node_crypto_1.default.createHash('md5');
    cacheKeyParts.forEach((part) => key.update(part));
    return key.digest('hex');
}
const babelTransformer = {
    transform,
    getCacheKey,
};
module.exports = babelTransformer;
//# sourceMappingURL=babel-transformer.js.map
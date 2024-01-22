"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExoticTransformer = void 0;
const createMatcher_1 = require("./createMatcher");
const createMultiRuleTransformer_1 = require("./createMultiRuleTransformer");
const getCacheKey_1 = require("./getCacheKey");
/**
 * Create an experimental multi-rule transformer for a React Native app.
 *
 * @example
 * ```
 * module.exports = createExoticTransformer({
 *    nodeModulesPaths: ['react-native'],
 *    transpileModules: ['@stripe/stripe-react-native'],
 * });
 * ```
 *
 * @param props.nodeModulesPaths paths to node_modules folders, relative to project root. Default: `['node_modules']`
 * @param props.transpileModules matchers for module names that should be transpiled using the project Babel configuration. Example: `['@stripe/stripe-react-native']`
 * @returns a Metro `transformer` function and default `getCacheKey` function.
 */
function createExoticTransformer({ nodeModulesPaths, transpileModules, }) {
    if (!nodeModulesPaths) {
        nodeModulesPaths = ['node_modules'];
    }
    // Match any node modules, or monorepo module.
    const nodeModuleMatcher = (0, createMatcher_1.createModuleMatcher)({ folders: nodeModulesPaths, moduleIds: [] });
    // Match node modules which are so oddly written that we must
    // transpile them with every possible option (most expensive).
    const impossibleNodeModuleMatcher = (0, createMatcher_1.createModuleMatcher)({
        moduleIds: [
            // victory is too wild
            // SyntaxError in ../../node_modules/victory-native/lib/components/victory-primitives/bar.js: Missing semicolon. (9:1)
            'victory',
            // vector icons has some hidden issues that break NCL
            '@expo/vector-icons',
            ...(transpileModules || []),
        ],
        folders: nodeModulesPaths,
    });
    const transform = (0, createMultiRuleTransformer_1.createMultiRuleTransformer)({
        // Specify which rules to use on a per-file basis, basically
        // this is used to determine which modules are node modules, and which are application code.
        getRuleType({ filename }) {
            // Is a node module, and is not one of the impossible modules.
            return nodeModuleMatcher.test(filename) && !impossibleNodeModuleMatcher.test(filename)
                ? 'module'
                : 'app';
        },
        // Order is very important, we use wild card matchers to transpile
        // "every unhandled node module" and "every unhandled application module".
        rules: [
            // Match bob compiler modules, use the passthrough loader.
            {
                name: 'bob',
                type: 'module',
                test: (0, createMatcher_1.createModuleMatcher)({ moduleIds: ['.*/lib/commonjs/'], folders: nodeModulesPaths }),
                transform: createMultiRuleTransformer_1.loaders.passthroughModule,
                warn: true,
            },
            // Match React Native modules, convert them statically using sucrase.
            {
                name: 'react-native',
                type: 'module',
                test: (0, createMatcher_1.createReactNativeMatcher)({ folders: nodeModulesPaths }),
                transform: createMultiRuleTransformer_1.loaders.reactNativeModule,
                warn: true,
            },
            // Match Expo SDK modules, convert them statically using sucrase.
            {
                name: 'expo-module',
                type: 'module',
                test: (0, createMatcher_1.createExpoMatcher)({ folders: nodeModulesPaths }),
                transform: createMultiRuleTransformer_1.loaders.expoModule,
                warn: true,
            },
            // Match known problematic modules, convert them statically using an expensive, dynamic sucrase.
            {
                name: 'sucrase',
                type: 'module',
                test: (0, createMatcher_1.createKnownCommunityMatcher)({
                    folders: nodeModulesPaths,
                }),
                transform: createMultiRuleTransformer_1.loaders.untranspiledModule,
                warn: true,
            },
            // Pass through any unhandled node modules as passthrough, this is where the most savings occur.
            // Ideally, you want your project to pass all node modules through this loader.
            // This should be the last "module" rule.
            // Message library authors and ask them to ship their modules as pre-transpiled
            // commonjs, to improve the development speed of your project.
            {
                name: 'skip-module',
                type: 'module',
                test: () => true,
                transform: createMultiRuleTransformer_1.loaders.passthroughModule,
            },
            // All application code should be transpiled with the user's babel preset,
            // this is the most expensive operation but provides the most customization to the user.
            // The goal is to use this as sparingly as possible.
            {
                name: 'babel',
                test: () => true,
                transform: createMultiRuleTransformer_1.loaders.app,
            },
        ],
    });
    return {
        transform,
        getCacheKey: getCacheKey_1.getCacheKey,
    };
}
exports.createExoticTransformer = createExoticTransformer;
//# sourceMappingURL=createExoticTransformer.js.map
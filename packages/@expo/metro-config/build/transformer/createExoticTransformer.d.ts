import { BabelTransformer } from 'metro-babel-transformer';
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
export declare function createExoticTransformer({ nodeModulesPaths, transpileModules, }: {
    nodeModulesPaths?: string[];
    transpileModules?: string[];
}): BabelTransformer;

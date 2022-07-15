"use strict";
// Copyright 2021-present 650 Industries (Expo). All rights reserved.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const resolve_from_1 = __importDefault(require("resolve-from"));
const getCacheKey_1 = require("./getCacheKey");
let transformer = null;
function resolveTransformer(projectRoot) {
    if (transformer) {
        return transformer;
    }
    const resolvedPath = resolve_from_1.default.silent(projectRoot, 'metro-react-native-babel-transformer');
    if (!resolvedPath) {
        throw new Error('Missing package "metro-react-native-babel-transformer" in the project. ' +
            'This usually means `react-native` is not installed. ' +
            'Please verify that dependencies in package.json include "react-native" ' +
            'and run `yarn` or `npm install`.');
    }
    transformer = require(resolvedPath);
    return transformer;
}
/**
 * Extends the default `metro-react-native-babel-transformer`
 * and uses babel-preset-expo as the default instead of metro-react-native-babel-preset.
 * This enables users to safely transpile an Expo project without
 * needing to explicitly define a `babel.config.js`
 *
 * @param filename string
 * @param options BabelTransformerOptions
 * @param plugins $PropertyType<BabelCoreOptions, 'plugins'>
 * @param src string
 *
 * @returns
 */
function transform(props) {
    // Use babel-preset-expo by default if available...
    props.options.extendsBabelConfigPath = resolve_from_1.default.silent(props.options.projectRoot, 'babel-preset-expo');
    return resolveTransformer(props.options.projectRoot).transform(props);
}
module.exports = {
    getCacheKey: getCacheKey_1.getCacheKey,
    transform,
};
//# sourceMappingURL=metro-expo-babel-transformer.js.map
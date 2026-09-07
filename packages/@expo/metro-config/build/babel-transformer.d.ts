/**
 * Copyright (c) 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { BabelTransformer, BabelTransformerArgs, BabelTransformerCacheKeyOptions } from '@expo/metro/metro-babel-transformer';
import type { TransformOptions } from './babel-core';
export type ExpoBabelCaller = TransformOptions['caller'] & {
    babelRuntimeVersion?: string;
    metroSourceType?: 'script' | 'module' | 'asset';
    supportsReactCompiler?: boolean;
    isReactServer?: boolean;
    isHMREnabled?: boolean;
    isServer?: boolean;
    isNodeModule?: boolean;
    preserveEnvVars?: boolean;
    isDev?: boolean;
    asyncRoutes?: boolean;
    baseUrl?: string;
    engine?: string;
    bundler?: 'metro' | (string & object);
    platform?: string | null;
    routerRoot?: string;
    projectRoot: string;
    /** When true, indicates this bundle should contain only the loader export */
    isLoaderBundle?: boolean;
    /** When true, indicates this file is part of a DOM component bundle */
    isDomComponent?: boolean;
};
export type ExpoBabelTransformerCacheKeyOptions = BabelTransformerCacheKeyOptions & {
    extendsBabelConfigPath?: string;
};
/**
 * Metro's Babel transformer options plus the fields Metro's transform worker passes through
 * from `JsTransformOptions` without declaring them on the Babel transformer's own type.
 */
export type ExpoBabelTransformerOptions = BabelTransformerArgs['options'] & {
    /** The kind of file being transformed, forwarded from `JsTransformOptions['type']`. */
    type?: 'script' | 'module' | 'asset';
};
export type ExpoBabelTransformerArgs = Omit<BabelTransformerArgs, 'options'> & {
    options: ExpoBabelTransformerOptions;
};
export type ExpoBabelTransformer = Omit<BabelTransformer, 'getCacheKey'> & {
    getCacheKey?: (options?: ExpoBabelTransformerCacheKeyOptions) => string;
};

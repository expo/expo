/**
 * Copyright (c) 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { BabelTransformer, BabelTransformerArgs } from '@bycedric/metro/metro-babel-transformer';
import type { TransformOptions } from './babel-core';
export type ExpoBabelCaller = TransformOptions['caller'] & {
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
};
export type ExpoBabelTransformResult = ReturnType<BabelTransformer['transform']> & {
    metadata?: ReturnType<BabelTransformer['transform']>['metadata'] & {
        hasCjsExports?: boolean;
        reactClientReference?: string;
        expoDomComponentReference?: string;
    };
};
declare const babelTransformer: {
    transform: ({ filename, src, options, plugins, }: BabelTransformerArgs) => ExpoBabelTransformResult;
};
export default babelTransformer;

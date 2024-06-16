/**
 * Copyright (c) 650 Industries (Expo). All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import * as babel from './babel-core';
export declare function transformSync(src: string, babelConfig: babel.TransformOptions, { hermesParser }: {
    hermesParser?: boolean;
}): import("@babel/core").BabelFileResult | null;

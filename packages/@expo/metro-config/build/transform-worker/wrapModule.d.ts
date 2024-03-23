/**
 * Copyright 2023-present 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Based on upstream but with our PR merged:
 * https://github.com/facebook/metro/blob/c6f6ca76840bef4415c8acbdec4491b84906da78/packages/metro/src/ModuleGraph/worker/JsFileWrapping.js#L1C1-L145C3
 * https://github.com/facebook/metro/pull/1230
 */
import { ParseResult } from '@babel/parser';
import * as t from '@babel/types';
export declare function wrapModule(fileAst: ParseResult<t.File>, importDefaultName: string, importAllName: string, dependencyMapName: string, globalPrefix: string, skipRequireRename: boolean): {
    ast: t.File;
    requireName: string;
};

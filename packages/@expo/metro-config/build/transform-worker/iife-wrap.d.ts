/**
 * Copyright © 2024 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import * as babylon from '@babel/parser';
import * as t from '@babel/types';
/** A fork of the upstream method but with the `require` rename removed since the modules already run scoped in iife. */
export declare function wrapModule(fileAst: babylon.ParseResult<t.File>, importDefaultName: string, importAllName: string, dependencyMapName: string, globalPrefix: string): t.File;

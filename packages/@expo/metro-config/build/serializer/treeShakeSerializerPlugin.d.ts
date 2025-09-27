/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { types } from '@babel/core';
import type { MixedOutput, Module, ReadOnlyGraph } from '@expo/metro/metro/DeltaBundler/types';
import type { SerializerConfigT } from '@expo/metro/metro-config';
import { ExpoSerializerOptions } from './fork/baseJSBundle';
type Serializer = NonNullable<SerializerConfigT['customSerializer']>;
type SerializerParameters = Parameters<Serializer>;
export declare function isModuleEmptyFor(ast?: types.File): boolean;
export declare function treeShakeSerializer(entryPoint: string, preModules: readonly Module<MixedOutput>[], graph: ReadOnlyGraph, options: ExpoSerializerOptions): Promise<SerializerParameters>;
export {};

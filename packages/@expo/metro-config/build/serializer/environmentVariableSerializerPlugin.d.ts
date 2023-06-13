/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { ReadOnlyGraph, MixedOutput, Module, SerializerOptions } from 'metro';
import { SerializerParameters } from './withExpoSerializers';
export declare function replaceEnvironmentVariables(code: string, env: Record<string, string | undefined>): string;
export declare function getTransformEnvironment(url: string): string | null;
export declare function environmentVariableSerializerPlugin(entryPoint: string, preModules: readonly Module<MixedOutput>[], graph: ReadOnlyGraph, options: SerializerOptions): SerializerParameters;

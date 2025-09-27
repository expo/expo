/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { ReadOnlyGraph, MixedOutput, Module, SerializerOptions } from '@expo/metro/metro/DeltaBundler/types';
import { SerializerParameters } from './withExpoSerializers';
export declare function getTransformEnvironment(url: string): string | null;
/** Strips the process.env polyfill in server environments to allow for accessing environment variables off the global. */
export declare function serverPreludeSerializerPlugin(entryPoint: string, preModules: readonly Module<MixedOutput>[], graph: ReadOnlyGraph, options: SerializerOptions): SerializerParameters;
export declare function environmentVariableSerializerPlugin(entryPoint: string, preModules: readonly Module<MixedOutput>[], graph: ReadOnlyGraph, options: SerializerOptions): SerializerParameters;
export declare function getEnvVarDevString(env?: NodeJS.ProcessEnv): string;

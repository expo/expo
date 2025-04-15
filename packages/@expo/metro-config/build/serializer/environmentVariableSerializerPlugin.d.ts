/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { ReadOnlyGraph, MixedOutput, Module, SerializerOptions } from 'metro';
import CountingSet from 'metro/src/lib/CountingSet';
import { SerializerParameters } from './withExpoSerializers';
export declare function getTransformEnvironment(url: string): string | null;
/** Strips the process.env polyfill in server environments to allow for accessing environment variables off the global. */
export declare function serverPreludeSerializerPlugin(entryPoint: string, preModules: readonly Module<MixedOutput>[], graph: ReadOnlyGraph, options: SerializerOptions): SerializerParameters;
export declare function prepareVirtualEnvVarModule(module: Module<any>, graph: ReadOnlyGraph<any>): Readonly<{
    dependencies: Map<string, Readonly<{
        absolutePath: string;
        data: import("metro").TransformResultDependency;
    }>>;
    inverseDependencies: CountingSet<string>;
    output: readonly any[];
    path: string;
    getSource: () => Buffer;
    unstable_transformResultKey?: null | undefined | string;
}>;
export declare function environmentVariableSerializerPlugin(entryPoint: string, preModules: readonly Module<MixedOutput>[], graph: ReadOnlyGraph, options: SerializerOptions): SerializerParameters;
export declare function getEnvVarDevString(env?: NodeJS.ProcessEnv): string;

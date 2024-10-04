/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { Graph, Module, SerializerOptions } from 'metro';
import { ConfigT, InputConfigT } from 'metro-config';
type Serializer = NonNullable<ConfigT['serializer']['customSerializer']>;
type SerializerParameters = Parameters<Serializer>;
type SerialProcessor = (...props: SerializerParameters) => SerializerParameters;
export declare function replaceEnvironmentVariables(code: string, env: Record<string, string | undefined>): string;
export declare function getTransformEnvironment(url: string): string | null;
export declare function serializeWithEnvironmentVariables(entryPoint: string, preModules: readonly Module[], graph: Graph, options: SerializerOptions): SerializerParameters;
export declare function withExpoSerializers(config: InputConfigT): InputConfigT;
export declare function withSerialProcessors(config: InputConfigT, processors: SerialProcessor[]): InputConfigT;
export declare function createSerializerFromSerialProcessors(processors: (SerialProcessor | undefined)[], serializer?: Serializer): Serializer;
export {};

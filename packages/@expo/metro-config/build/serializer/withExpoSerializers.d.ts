/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { MetroConfig } from '@expo/metro/metro';
import type { Module, ReadOnlyGraph, MixedOutput } from '@expo/metro/metro/DeltaBundler';
import type { ConfigT, InputConfigT } from '@expo/metro/metro-config';
import { ExpoSerializerOptions } from './fork/baseJSBundle';
import { SerialAsset } from './serializerAssets';
export type Serializer = NonNullable<ConfigT['serializer']['customSerializer']>;
export type SerializerParameters = [
    string,
    readonly Module[],
    ReadOnlyGraph,
    ExpoSerializerOptions
];
export type SerializerConfigOptions = {
    unstable_beforeAssetSerializationPlugins?: ((serializationInput: {
        graph: ReadOnlyGraph<MixedOutput>;
        premodules: Module[];
        debugId?: string;
    }) => Module[])[];
};
export type SerializerPlugin = (...props: SerializerParameters) => SerializerParameters | Promise<SerializerParameters>;
export declare function withExpoSerializers<Config extends InputConfigT = InputConfigT>(config: Config, options?: SerializerConfigOptions): Config;
export declare function withSerializerPlugins<Config extends InputConfigT = InputConfigT>(config: Config, processors: SerializerPlugin[], options?: SerializerConfigOptions): Config;
export declare function createDefaultExportCustomSerializer(config: Partial<MetroConfig>, configOptions?: SerializerConfigOptions): Serializer;
export declare function createSerializerFromSerialProcessors(config: MetroConfig, processors: (SerializerPlugin | undefined)[], originalSerializer: Serializer | null, options?: SerializerConfigOptions): Serializer;
export { SerialAsset };

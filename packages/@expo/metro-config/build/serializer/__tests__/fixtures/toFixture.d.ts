/// <reference types="metro-babel-transformer" />
import { Graph } from 'metro';
import { SerializerParameters } from '../../withExpoSerializers';
export declare function simplifyGraph(graph: Graph, dropSource?: boolean): {
    dependencies: {
        [k: string]: {
            dependencies: {
                [k: string]: import("metro").Dependency;
            };
            getSource: string;
            inverseDependencies: string[];
            path: string;
            output: {
                type: string;
                data: {
                    map?: never[] | undefined;
                    code: string;
                    functionMap?: {} | undefined;
                };
            }[];
        };
    };
    entryPoints: [string, string][];
    transformOptions: {
        customTransformOptions: {
            [x: string]: unknown;
            __proto__?: null | undefined;
        };
        dev: boolean;
        experimentalImportSupport?: boolean | undefined;
        hot: boolean;
        minify: boolean;
        nonInlinedRequires?: readonly string[] | undefined;
        platform?: string | undefined;
        runtimeBytecodeVersion?: number | undefined;
        type: import("metro-transform-worker").Type;
        unstable_disableES6Transforms?: boolean | undefined;
        unstable_transformProfile: import("metro-babel-transformer").TransformProfile;
    };
};
export declare function toFixture(...props: SerializerParameters): void;

import type Metro from 'metro';
import type MetroConfig from 'metro-config';
import type { composeSourceMaps } from 'metro-source-map';
export declare function importMetroSourceMapComposeSourceMapsFromProject(projectRoot: string): typeof composeSourceMaps;
export declare function importMetroConfigFromProject(projectRoot: string): typeof MetroConfig;
export declare function importMetroFromProject(projectRoot: string): typeof Metro;
export declare function importMetroServerFromProject(projectRoot: string): typeof Metro.Server;
export declare function importCliServerApiFromProject(projectRoot: string): typeof import('@react-native-community/cli-server-api');
export declare function importInspectorProxyServerFromProject(projectRoot: string): {
    InspectorProxy: any;
};
export declare function importExpoMetroConfigFromProject(projectRoot: string): typeof import('@expo/metro-config');
export declare function importHermesCommandFromProject(projectRoot: string): string;

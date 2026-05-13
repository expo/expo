import type { ExpoConfig } from 'expo/config';
import type { PluginConfig, PluginProps, Publication } from '../types';
export declare const getPluginConfig: (props: PluginProps, config: ExpoConfig) => PluginConfig;
export declare const getPackagePath: (packageId: string) => string;
export declare const getProjectRoot: (config: ExpoConfig) => string;
export declare const getPublishing: (props: PluginProps) => Publication[];
export declare const getVersion: (props: PluginProps) => string;

import { IServerConfig } from '../types';
export declare const STORY_CACHE_DIR = "__generated__/stories";
export declare const defaultConfig: IServerConfig;
export declare function mergeConfigs(serverConfig: IServerConfig): IServerConfig;
export declare function getManifestFilePath(config: IServerConfig): string;
export declare function getStoryManifest(config: IServerConfig): any;
export declare function getStories(config: IServerConfig): any[];
export declare function getStoriesCacheDir(config: IServerConfig): string;
export declare function getStoriesFile(config: IServerConfig): string;

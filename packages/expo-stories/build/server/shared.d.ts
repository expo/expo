import { ServerConfig } from '../types';
export declare const STORY_CACHE_DIR = "__generated__/stories";
export declare const defaultConfig: ServerConfig;
export declare function mergeConfigs(serverConfig: ServerConfig): ServerConfig;
export declare function getManifestFilePath(config: ServerConfig): string;
export declare function getStoryManifest(config: ServerConfig): any;
export declare function getStories(config: ServerConfig): any[];
export declare function getStoriesCacheDir(config: ServerConfig): string;
export declare function getStoriesFile(config: ServerConfig): string;

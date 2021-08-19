import { StoryOptions, StoryManifest } from '../types';
export declare const storiesDirName = "__generated__/stories";
export declare const defaultConfig: StoryOptions;
export declare function getManifestFilePath(projectRoot: string): string;
export declare function getStoryManifest(projectRoot: string): StoryManifest;
export declare function getStories(config: StoryOptions): import("../types").StoryFile[];
export declare function getStoriesDir(config: StoryOptions): string;
export declare function getStoriesFile(config: StoryOptions): string;
export declare function hashPath(filePath: string): string;

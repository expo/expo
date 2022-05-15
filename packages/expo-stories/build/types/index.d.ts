export interface StoryOptions {
    projectRoot: string;
    watchRoots: string[];
}
export declare type StoryManifest = {
    files: Record<string, StoryFile>;
};
export declare type StoryFile = {
    id: string;
    fullPath: string;
    relativePath: string;
    title: string;
    stories: StoryItem[];
};
export declare type StoryItem = {
    id: string;
    name: string;
};
//# sourceMappingURL=index.d.ts.map
export interface StoryOptions {
    projectRoot: string;
    watchRoots: string[];
}
export type StoryManifest = {
    files: Record<string, StoryFile>;
};
export type StoryFile = {
    id: string;
    fullPath: string;
    relativePath: string;
    title: string;
    stories: StoryItem[];
};
export type StoryItem = {
    id: string;
    name: string;
};
//# sourceMappingURL=index.d.ts.map
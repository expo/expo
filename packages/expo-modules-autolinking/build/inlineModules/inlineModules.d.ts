export type InlineModulesMirror = {
    files: {
        filePath: string;
        watchedDirRoot: string;
    }[];
    swiftModuleClassNames: string[];
    kotlinClasses: string[];
};
export declare function getAppRoot(): Promise<string>;
export declare function getMirrorStateObject(watchedDirectories: string[]): Promise<InlineModulesMirror>;

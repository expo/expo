export type LocalModulesMirror = {
    files: {
        filePath: string;
        watchedDirRoot: string;
    }[];
    swiftModuleClassNames: string[];
    kotlinClasses: string[];
};
export declare function getAppRoot(): Promise<string>;
export declare function getMirrorStateObject(watchedDirs: string[]): Promise<LocalModulesMirror>;

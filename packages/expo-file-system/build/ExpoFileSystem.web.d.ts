declare class FileSystemFile {
    constructor();
}
declare class FileSystemDirectory {
    constructor();
}
declare const _default: {
    FileSystemDirectory: typeof FileSystemDirectory;
    FileSystemFile: typeof FileSystemFile;
    downloadFileAsync: () => Promise<void>;
    pickDirectoryAsync: () => Promise<void>;
    pickFileAsync: () => Promise<void>;
    readonly totalDiskSpace: number;
    readonly availableDiskSpace: number;
    readonly documentDirectory: string;
    readonly cacheDirectory: string;
    readonly bundleDirectory: string;
};
export default _default;
//# sourceMappingURL=ExpoFileSystem.web.d.ts.map
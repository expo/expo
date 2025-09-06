declare class FileSystemFile {
}
declare class FileSystemDirectory {
}
declare const _default: {
    FileSystemDirectory: typeof FileSystemDirectory;
    FileSystemFile: typeof FileSystemFile;
    downloadFileAsync: () => Promise<void>;
    pickDirectoryAsync: () => Promise<void>;
    pickFileAsync: () => Promise<void>;
    totalDiskSpace: number;
    availableDiskSpace: number;
    documentDirectory: string;
    cacheDirectory: string;
    bundleDirectory: string;
};
export default _default;
//# sourceMappingURL=ExpoFileSystem.web.d.ts.map
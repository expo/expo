declare class FileSystemFile {
    constructor();
}
declare class FileSystemDirectory {
    constructor();
}
declare class FileSystemUploadTask {
    start(): Promise<{
        body: string;
        status: number;
        headers: {};
    }>;
    cancel(): void;
}
declare class FileSystemDownloadTask {
    start(): Promise<null>;
    pause(): {
        resumeData: string;
    };
    resume(): Promise<null>;
    cancel(): void;
}
declare const _default: {
    FileSystemDirectory: typeof FileSystemDirectory;
    FileSystemFile: typeof FileSystemFile;
    FileSystemUploadTask: typeof FileSystemUploadTask;
    FileSystemDownloadTask: typeof FileSystemDownloadTask;
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
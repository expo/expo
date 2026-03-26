import ExpoFileSystem from './ExpoFileSystem';
import type { ZipEntry } from './ExpoFileSystem.types';
declare const NativeZipArchive: typeof import("./ExpoFileSystem.types").ZipArchive;
export declare class ZipArchive extends NativeZipArchive {
    list(): ZipEntry[];
    extractEntry(entryName: string, destination: InstanceType<typeof ExpoFileSystem.FileSystemFile> | InstanceType<typeof ExpoFileSystem.FileSystemDirectory>): Promise<InstanceType<typeof ExpoFileSystem.FileSystemFile>>;
    extractEntrySync(entryName: string, destination: InstanceType<typeof ExpoFileSystem.FileSystemFile> | InstanceType<typeof ExpoFileSystem.FileSystemDirectory>): InstanceType<typeof ExpoFileSystem.FileSystemFile>;
    asFile(): InstanceType<typeof ExpoFileSystem.FileSystemFile>;
    close(): void;
    [Symbol.dispose](): void;
}
export {};
//# sourceMappingURL=ZipArchive.d.ts.map
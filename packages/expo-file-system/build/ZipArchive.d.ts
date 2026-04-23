import ExpoFileSystem from './ExpoFileSystem';
import type { ZipEntry } from './ExpoFileSystem.types';
export declare class ZipArchive extends ExpoFileSystem.ZipArchive {
    list(): ZipEntry[];
    extractEntry(entryName: string, destination: InstanceType<typeof ExpoFileSystem.FileSystemFile> | InstanceType<typeof ExpoFileSystem.FileSystemDirectory>): Promise<InstanceType<typeof ExpoFileSystem.FileSystemFile>>;
    extractEntrySync(entryName: string, destination: InstanceType<typeof ExpoFileSystem.FileSystemFile> | InstanceType<typeof ExpoFileSystem.FileSystemDirectory>): InstanceType<typeof ExpoFileSystem.FileSystemFile>;
    asFile(): InstanceType<typeof ExpoFileSystem.FileSystemFile>;
    close(): void;
    [Symbol.dispose](): void;
}
//# sourceMappingURL=ZipArchive.d.ts.map
import ExpoFileSystem from './ExpoFileSystem';
import type { ZipOptions, UnzipOptions } from './ExpoFileSystem.types';
type File = InstanceType<typeof ExpoFileSystem.FileSystemFile>;
type Directory = InstanceType<typeof ExpoFileSystem.FileSystemDirectory>;
/**
 * Compresses one or more files/directories into a zip archive.
 * @param sources Array of `File` and/or `Directory` instances to compress.
 * @param destination The destination `File` (used as archive path) or `Directory` (archive created inside with auto-generated name).
 * @param options Zip options.
 * @returns The created archive `File`.
 */
export declare function zip(sources: (File | Directory)[], destination: File | Directory, options?: ZipOptions): Promise<File>;
/**
 * Synchronous version of `zip()`.
 */
export declare function zipSync(sources: (File | Directory)[], destination: File | Directory, options?: ZipOptions): File;
/**
 * Extracts a zip archive to the destination directory.
 * @param source The zip archive `File`.
 * @param destination The directory to extract into.
 * @param options Unzip options.
 * @returns The destination `Directory`.
 */
export declare function unzip(source: File, destination: Directory, options?: UnzipOptions): Promise<Directory>;
/**
 * Synchronous version of `unzip()`.
 */
export declare function unzipSync(source: File, destination: Directory, options?: UnzipOptions): Directory;
export {};
//# sourceMappingURL=ZipOperations.d.ts.map
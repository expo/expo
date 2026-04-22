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
export async function zip(
  sources: (File | Directory)[],
  destination: File | Directory,
  options?: ZipOptions
): Promise<File> {
  return ExpoFileSystem.zip(sources, destination, options);
}

/**
 * Synchronous version of `zip()`.
 */
export function zipSync(
  sources: (File | Directory)[],
  destination: File | Directory,
  options?: ZipOptions
): File {
  return ExpoFileSystem.zipSync(sources, destination, options);
}

/**
 * Extracts a zip archive to the destination directory.
 * @param source The zip archive `File`.
 * @param destination The directory to extract into.
 * @param options Unzip options.
 * @returns The destination `Directory`.
 */
export async function unzip(
  source: File,
  destination: Directory,
  options?: UnzipOptions
): Promise<Directory> {
  return ExpoFileSystem.unzip(source, destination, options);
}

/**
 * Synchronous version of `unzip()`.
 */
export function unzipSync(source: File, destination: Directory, options?: UnzipOptions): Directory {
  return ExpoFileSystem.unzipSync(source, destination, options);
}

import ExpoFileSystem from './ExpoFileSystem';
import type { ZipEntry } from './ExpoFileSystem.types';
import { File } from './FileSystem';

// The native ZipArchive SharedObject class
const NativeZipArchive = ExpoFileSystem.ZipArchive;

export class ZipArchive extends NativeZipArchive {
  list(): ZipEntry[] {
    const rawEntries = super.list();
    // Convert lastModified timestamps to Date objects
    return rawEntries.map((entry: any) => ({
      ...entry,
      lastModified: entry.lastModified != null ? new Date(entry.lastModified) : undefined,
    }));
  }

  async extractEntry(
    entryName: string,
    destination:
      | InstanceType<typeof ExpoFileSystem.FileSystemFile>
      | InstanceType<typeof ExpoFileSystem.FileSystemDirectory>
  ): Promise<InstanceType<typeof ExpoFileSystem.FileSystemFile>> {
    const result = await super.extractEntry(entryName, destination);
    return new File(result.uri);
  }

  extractEntrySync(
    entryName: string,
    destination:
      | InstanceType<typeof ExpoFileSystem.FileSystemFile>
      | InstanceType<typeof ExpoFileSystem.FileSystemDirectory>
  ): InstanceType<typeof ExpoFileSystem.FileSystemFile> {
    const result = super.extractEntrySync(entryName, destination);
    return new File(result.uri);
  }

  asFile(): InstanceType<typeof ExpoFileSystem.FileSystemFile> {
    // Access the underlying file URL from the native object and create a File
    return super.asFile();
  }

  close(): void {
    super.close();
  }

  [Symbol.dispose](): void {
    this.close();
  }
}

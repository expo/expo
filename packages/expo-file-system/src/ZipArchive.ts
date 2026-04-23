import ExpoFileSystem from './ExpoFileSystem';
import type { ZipEntry } from './ExpoFileSystem.types';
import { File } from './FileSystem';

export class ZipArchive extends ExpoFileSystem.ZipArchive {
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
    const result = super.asFile();
    return new File(result.uri);
  }

  close(): void {
    super.close();
  }

  [Symbol.dispose](): void {
    this.close();
  }
}

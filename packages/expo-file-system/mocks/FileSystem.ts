export type URL = string;

export type FileSystemPath = any;

export type DownloadOptions = any;

export type InfoOptions = any;

export type TypedArray = any;

export type CreateOptions = any;

export const documentDirectory = 'file:///mock/document/';
export const cacheDirectory = 'file:///mock/cache/';
export const bundleDirectory = 'file:///mock/bundle/';
export const totalDiskSpace = 1000000000;
export const availableDiskSpace = 500000000;

export function info(url: URL): any {}

export async function downloadFileAsync(
  url: URL,
  to: FileSystemPath,
  options: DownloadOptions | undefined,
  uuid: string | undefined
): Promise<any> {}

function resolveZipName(source: FileSystemPath): string {
  const uri = source?.uri ?? 'file:///mock/archive';
  const trimmed = uri.replace(/\/$/, '');
  const baseName = trimmed.split('/').pop() || 'archive';
  return baseName.endsWith('.zip') ? baseName : `${baseName}.zip`;
}

function resolveZipDestination(destination: FileSystemPath, sources: FileSystemPath[]): FileSystemFile {
  if (destination instanceof FileSystemDirectory) {
    const slash = destination.uri.endsWith('/') ? '' : '/';
    return new FileSystemFile(`${destination.uri}${slash}${resolveZipName(sources[0])}`);
  }
  return new FileSystemFile(destination.uri);
}

export async function zip(
  sources: FileSystemPath[],
  destination: FileSystemPath,
  options?: any
): Promise<any> {
  return resolveZipDestination(destination, sources);
}

export function zipSync(
  sources: FileSystemPath[],
  destination: FileSystemPath,
  options?: any
): any {
  return resolveZipDestination(destination, sources);
}

export async function unzip(
  source: FileSystemPath,
  destination: FileSystemPath,
  options?: any
): Promise<any> {
  return new FileSystemDirectory(destination.uri);
}

export function unzipSync(
  source: FileSystemPath,
  destination: FileSystemPath,
  options?: any
): any {
  return new FileSystemDirectory(destination.uri);
}

export async function pickDirectoryAsync(initialUri?: string): Promise<any> {}

export async function pickFileAsync(initialUri?: string, mimeType?: string): Promise<any> {}

export function cancelDownloadAsync(uuid: string): void {}
export class FileSystemFile {
  uri: string;
  exists: boolean = false;
  constructor(uri: string) {
    this.uri = uri;
  }
  validatePath(): any {}
  textSync(): any {}
  base64Sync(): any {}
  bytesSync(): any {}
  open(): any {}
  info(options: InfoOptions | undefined): any {}
  write(content: string | TypedArray): any {}
  delete(): any {}
  create(options: CreateOptions | undefined): any {}
  async copy(to: FileSystemPath): Promise<any> {}
  copySync(to: FileSystemPath): any {}
  async move(to: FileSystemPath): Promise<any> {}
  moveSync(to: FileSystemPath): any {}
  rename(newName: string): any {}
  async text(): Promise<any> {}
  async base64(): Promise<any> {}
  async bytes(): Promise<any> {}
}

export class FileSystemFileHandle {
  readBytes(bytes: number): any {}
  writeBytes(bytes: TypedArray): any {}
  close(): any {}
}

export class FileSystemDirectory {
  uri: string;
  exists: boolean = false;
  constructor(uri: string) {
    this.uri = uri;
  }
  info(): any {}
  validatePath(): any {}
  delete(): any {}
  create(options: CreateOptions | undefined): any {}
  async copy(to: FileSystemPath): Promise<any> {}
  copySync(to: FileSystemPath): any {}
  async move(to: FileSystemPath): Promise<any> {}
  moveSync(to: FileSystemPath): any {}
  rename(newName: string): any {}
  listAsRecords(): any {}
  createFile(name: string, mimeType: string | null): any {}
  createDirectory(name: string): any {}
}

export class ZipArchive {
  source: FileSystemFile;
  constructor(source: FileSystemFile) {
    this.source = source;
  }
  list(): any[] {
    return [];
  }
  async extractEntry(entryName: string, destination: FileSystemPath): Promise<any> {
    return this.extractEntrySync(entryName, destination);
  }
  extractEntrySync(entryName: string, destination: FileSystemPath): any {
    if (destination instanceof FileSystemDirectory) {
      const slash = destination.uri.endsWith('/') ? '' : '/';
      const fileName = entryName.split('/').pop() || 'entry';
      return new FileSystemFile(`${destination.uri}${slash}${fileName}`);
    }
    return new FileSystemFile(destination.uri);
  }
  asFile(): any {
    return this.source;
  }
  close(): void {}
}

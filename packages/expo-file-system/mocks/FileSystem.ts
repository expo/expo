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
  options: DownloadOptions | undefined
): Promise<any> {}

export async function pickDirectoryAsync(initialUri?: string): Promise<any> {}

export async function pickFileAsync(initialUri?: string, mimeType?: string): Promise<any> {}

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
  copy(to: FileSystemPath): any {}
  move(to: FileSystemPath): any {}
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
  copy(to: FileSystemPath): any {}
  move(to: FileSystemPath): any {}
  rename(newName: string): any {}
  listAsRecords(): any {}
  createFile(name: string, mimeType: string | null): any {}
  createDirectory(name: string): any {}
}

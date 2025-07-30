export type URL = string;

export type FileSystemPath = any;

export type DownloadOptions = any;

export type InfoOptions = any;

export type TypedArray = any;

export type CreateOptions = any;

export function info(url: URL): any {}

export async function downloadFileAsync(
  url: URL,
  to: FileSystemPath,
  options: DownloadOptions | undefined
): Promise<any> {}

export class FileSystemFile {
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
  info(): any {}
  validatePath(): any {}
  delete(): any {}
  create(options: CreateOptions | undefined): any {}
  copy(to: FileSystemPath): any {}
  move(to: FileSystemPath): any {}
  listAsRecords(): any {}
}

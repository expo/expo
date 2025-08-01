export type URL = string;

export type InfoOptions = any;

export type ReadingOptions = any;

export type WritingOptions = any;

export type DeletingOptions = any;

export type RelocatingOptions = any;

export type MakeDirectoryOptions = any;

export type DownloadOptionsLegacy = any;

export type UploadOptions = any;

export type Int64 = number;

export async function getInfoAsync(url: URL, options: InfoOptions): Promise<any> {}

export async function readAsStringAsync(url: URL, options: ReadingOptions): Promise<string> {
  return '';
}

export async function writeAsStringAsync(
  url: URL,
  string: string,
  options: WritingOptions
): Promise<any> {}

export async function deleteAsync(url: URL, options: DeletingOptions): Promise<any> {}

export async function moveAsync(options: RelocatingOptions): Promise<any> {}

export async function copyAsync(options: RelocatingOptions): Promise<any> {}

export async function makeDirectoryAsync(url: URL, options: MakeDirectoryOptions): Promise<any> {}

export async function readDirectoryAsync(url: URL): Promise<string[]> {
  return [];
}

export async function downloadAsync(
  sourceUrl: URL,
  localUrl: URL,
  options: DownloadOptionsLegacy
): Promise<any> {}

export async function uploadAsync(
  targetUrl: URL,
  localUrl: URL,
  options: UploadOptions
): Promise<any> {}

export async function uploadTaskStartAsync(
  targetUrl: URL,
  localUrl: URL,
  uuid: string,
  options: UploadOptions
): Promise<any> {}

export async function downloadResumableStartAsync(
  sourceUrl: URL,
  localUrl: URL,
  uuid: string,
  options: DownloadOptionsLegacy,
  resumeDataString: string | undefined
): Promise<any> {}

export async function downloadResumablePauseAsync(id: string): Promise<{
  [key: string]: string | undefined;
}> {
  return {};
}

export async function networkTaskCancelAsync(id: string): Promise<any> {}

export async function getFreeDiskStorageAsync(): Promise<Int64> {
  return 0;
}

export async function getTotalDiskCapacityAsync(): Promise<number> {
  return 0;
}

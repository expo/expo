import type {
  DownloadOptions,
  FileSystemNetworkTaskProgressCallback,
  DownloadProgressData,
  UploadProgressData,
  FileInfo,
  FileSystemDownloadResult,
  FileSystemUploadOptions,
  FileSystemUploadResult,
  ReadingOptions,
  WritingOptions,
  DeletingOptions,
  InfoOptions,
  RelocatingOptions,
  MakeDirectoryOptions,
} from './legacy/FileSystem.types';

function errorOnLegacyMethodUse(methodName: string): Error {
  const message = `Method ${methodName} imported from "expo-file-system" is deprecated.\nYou can migrate to the new filesystem API using "File" and "Directory" classes or import the legacy API from "expo-file-system/legacy".\nAPI reference and examples are available in the filesystem docs: https://docs.expo.dev/versions/v54.0.0/sdk/filesystem/`;
  console.warn(message);
  return new Error(message);
}

/**
 * @deprecated Use `new File().info` or import this method from `expo-file-system/legacy`. This method will throw in runtime.
 */
export async function getInfoAsync(fileUri: string, options: InfoOptions = {}): Promise<FileInfo> {
  throw errorOnLegacyMethodUse('getInfoAsync');
}

/**
 * @deprecated Use `new File().text()` or import this method from `expo-file-system/legacy`. This method will throw in runtime.
 */
export async function readAsStringAsync(
  fileUri: string,
  options: ReadingOptions = {}
): Promise<string> {
  throw errorOnLegacyMethodUse('readAsStringAsync');
}

/**
 * @deprecated Import this method from `expo-file-system/legacy`. This method will throw in runtime.
 */
export async function getContentUriAsync(fileUri: string): Promise<string> {
  throw errorOnLegacyMethodUse('getContentUriAsync');
}

/**
 * @deprecated Use `new File().write()` or import this method from `expo-file-system/legacy`. This method will throw in runtime.
 */
export async function writeAsStringAsync(
  fileUri: string,
  contents: string,
  options: WritingOptions = {}
): Promise<void> {
  throw errorOnLegacyMethodUse('writeAsStringAsync');
}

/**
 * @deprecated Use `new File().delete()` or `new Directory().delete()` or import this method from `expo-file-system/legacy`. This method will throw in runtime.
 */
export async function deleteAsync(fileUri: string, options: DeletingOptions = {}): Promise<void> {
  throw errorOnLegacyMethodUse('deleteAsync');
}

/**
 * @deprecated
 */
export async function deleteLegacyDocumentDirectoryAndroid(): Promise<void> {
  throw errorOnLegacyMethodUse('deleteLegacyDocumentDirectoryAndroid');
}

/**
 * @deprecated Use `new File().move()` or import this method from `expo-file-system/legacy`. This method will throw in runtime.
 */
export async function moveAsync(options: RelocatingOptions): Promise<void> {
  throw errorOnLegacyMethodUse('moveAsync');
}

/**
 * @deprecated Use `new File().copy()` or import this method from `expo-file-system/legacy`. This method will throw in runtime.
 */
export async function copyAsync(options: RelocatingOptions): Promise<void> {
  throw errorOnLegacyMethodUse('copyAsync');
}

/**
 * @deprecated Use `new Directory().create()` or import this method from `expo-file-system/legacy`. This method will throw in runtime.
 */
export async function makeDirectoryAsync(
  fileUri: string,
  options: MakeDirectoryOptions = {}
): Promise<void> {
  throw errorOnLegacyMethodUse('makeDirectoryAsync');
}

/**
 * @deprecated Use `new Directory().list()` or import this method from `expo-file-system/legacy`. This method will throw in runtime.
 */
export async function readDirectoryAsync(fileUri: string): Promise<string[]> {
  throw errorOnLegacyMethodUse('readDirectoryAsync');
}

/**
 * @deprecated Use `Paths.availableDiskSpace` or import this method from `expo-file-system/legacy`. This method will throw in runtime.
 */
export async function getFreeDiskStorageAsync(): Promise<number> {
  throw errorOnLegacyMethodUse('getFreeDiskStorageAsync');
}

/**
 * @deprecated Use `Paths.totalDiskSpace` or import this method from `expo-file-system/legacy`. This method will throw in runtime.
 */
export async function getTotalDiskCapacityAsync(): Promise<number> {
  throw errorOnLegacyMethodUse('getTotalDiskCapacityAsync');
}

/**
 * @deprecated Use `File.downloadFileAsync` or import this method from `expo-file-system/legacy`. This method will throw in runtime.
 */
export async function downloadAsync(
  uri: string,
  fileUri: string,
  options: DownloadOptions = {}
): Promise<FileSystemDownloadResult> {
  throw errorOnLegacyMethodUse('downloadAsync');
}

/**
 * @deprecated Use `@expo/fetch` or import this method from `expo-file-system/legacy`. This method will throw in runtime.
 */
export async function uploadAsync(
  url: string,
  fileUri: string,
  options: FileSystemUploadOptions = {}
): Promise<FileSystemUploadResult> {
  throw errorOnLegacyMethodUse('uploadAsync');
}

/**
 * @deprecated Import this method from `expo-file-system/legacy`. This method will throw in runtime.
 */
export function createDownloadResumable(
  uri: string,
  fileUri: string,
  options?: DownloadOptions,
  callback?: FileSystemNetworkTaskProgressCallback<DownloadProgressData>,
  resumeData?: string
): any {
  throw errorOnLegacyMethodUse('createDownloadResumable');
}

/**
 * @deprecated Import this method from `expo-file-system/legacy`. This method will throw in runtime.
 */
export function createUploadTask(
  url: string,
  fileUri: string,
  options?: FileSystemUploadOptions,
  callback?: FileSystemNetworkTaskProgressCallback<UploadProgressData>
): any {
  throw errorOnLegacyMethodUse('createUploadTask');
}

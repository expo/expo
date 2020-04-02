export enum FileSystemSessionType {
  /*
   * Using this mode means that the downloading/uploading session on the native side will work even if the application is moved to the `background`.
   *
   * If the task completes when the application is in the `background`, the promise might be resolved immediately.
   * However, javascript execution will be stopped after a couple of seconds and it will be resumed when the application is moved to the `foreground` again.
   */
  BACKGROUND = 0,
  /*
   * Using this mode means that downloading/uploading session on the native side will be killed once the application becomes inactive (e.g. when it goes to `background`).
   * Bringing the application to the `foreground` again would trigger promise rejection.
   */
  FOREGROUND = 1,
}

export type DownloadOptions = {
  md5?: boolean;
  cache?: boolean;
  headers?: { [name: string]: string };
  /*
   * iOS only
   */
  sessionType?: FileSystemSessionType;
};

export type FileSystemHttpResult = {
  headers: { [name: string]: string };
  status: number;
  mimeType: string | null;
};

export type FileSystemDownloadResult = FileSystemHttpResult & {
  uri: string;
  md5?: string;
};

/**
 * @deprecated Use FileSystemDownloadResult instead.
 */
export type DownloadResult = FileSystemDownloadResult;

export type FileSystemUploadOptions = {
  headers?: { [name: string]: string };
  httpMethod?: FileSystemHttpMethods;
  sessionType?: FileSystemSessionType;
};

export type FileSystemUploadResult = FileSystemHttpResult & {
  body: string;
};

export type DownloadProgressCallback = (data: DownloadProgressData) => void;

export type DownloadProgressData = {
  totalBytesWritten: number;
  totalBytesExpectedToWrite: number;
};

export type DownloadPauseState = {
  url: string;
  fileUri: string;
  options: DownloadOptions;
  resumeData?: string;
};

export type FileInfo =
  | {
      exists: true;
      uri: string;
      size: number;
      isDirectory: boolean;
      modificationTime: number;
      md5?: string;
    }
  | {
      exists: false;
      uri: string;
      size: undefined;
      isDirectory: false;
      modificationTime: undefined;
      md5: undefined;
    };

export enum EncodingType {
  UTF8 = 'utf8',
  Base64 = 'base64',
}

export enum FileSystemHttpMethods {
  POST = 0,
  PUT = 1,
  PATCH = 2,
}

export type ReadingOptions = {
  encoding?: EncodingType | 'utf8' | 'base64';
  position?: number;
  length?: number;
};

export type WritingOptions = {
  encoding?: EncodingType | 'utf8' | 'base64';
};

export type ProgressEvent = {
  uuid: string;
  data: {
    totalBytesWritten: number;
    totalBytesExpectedToWrite: number;
  };
};

type PlatformMethod = (...args: any[]) => Promise<any>;

export interface ExponentFileSystemModule {
  readonly name: 'ExponentFileSystem';
  readonly documentDirectory: string | null;
  readonly cacheDirectory: string | null;
  readonly bundledAssets: string | null;
  readonly bundleDirectory: string | null;
  readonly getInfoAsync?: PlatformMethod;
  readonly readAsStringAsync?: PlatformMethod;
  readonly writeAsStringAsync?: PlatformMethod;
  readonly deleteAsync?: PlatformMethod;
  readonly moveAsync?: PlatformMethod;
  readonly copyAsync?: PlatformMethod;
  readonly makeDirectoryAsync?: PlatformMethod;
  readonly readDirectoryAsync?: PlatformMethod;
  readonly downloadAsync?: PlatformMethod;
  readonly uploadAsync?: PlatformMethod;
  readonly downloadResumableStartAsync?: PlatformMethod;
  readonly downloadResumablePauseAsync?: PlatformMethod;
  readonly getContentUriAsync?: PlatformMethod;
  readonly getFreeDiskStorageAsync?: PlatformMethod;
  readonly getTotalDiskCapacityAsync?: PlatformMethod;
  startObserving?: () => void;
  stopObserving?: () => void;
  addListener: (eventName: string) => void;
  removeListeners: (count: number) => void;
}

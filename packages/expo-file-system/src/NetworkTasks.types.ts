/**
 * Data provided to the `onProgress` callback during a file download.
 */
export type DownloadProgress = {
  /**
   * The number of bytes written so far.
   */
  bytesWritten: number;
  /**
   * The total number of bytes expected to be downloaded. `-1` if the server did not provide a `Content-Length` header.
   */
  totalBytes: number;
};

export type DownloadOptions = {
  /**
   * The headers to send with the request.
   */
  headers?: {
    [key: string]: string;
  };
  /**
   * This flag controls whether the `download` operation is idempotent
   * (safe to call multiple times without error).
   *
   * If `true`, downloading a file that already exists overwrites the previous one.
   * If `false`, an error is thrown when the target file already exists.
   *
   * @default false
   */
  idempotent?: boolean;
  /**
   * A callback that is invoked with progress updates during the download.
   */
  onProgress?: (data: DownloadProgress) => void;
  /**
   * An `AbortSignal` that can be used to cancel the download.
   * When the signal is aborted, the download is cancelled and the promise rejects with an `AbortError`.
   */
  signal?: AbortSignal;
};

/**
 * Represents the type of upload operation.
 */
export enum UploadType {
  /**
   * Binary content upload - the file is uploaded as-is in the request body.
   */
  BINARY_CONTENT = 0,
  /**
   * Multipart form upload - the file is uploaded as part of a multipart/form-data request.
   */
  MULTIPART = 1,
}

/**
 * Represents upload progress data.
 */
export type UploadProgress = {
  /**
   * The number of bytes sent so far.
   */
  bytesSent: number;
  /**
   * The total number of bytes to send.
   */
  totalBytes: number;
};

/**
 * Represents the result of an upload operation.
 */
export type UploadResult = {
  /**
   * The response body as a string.
   */
  body: string;
  /**
   * The HTTP status code.
   */
  status: number;
  /**
   * The response headers.
   */
  headers: Record<string, string>;
};

/**
 * The native URL session mode used by iOS upload and download tasks.
 */
export type NetworkTaskSessionType = 'background' | 'foreground';

/**
 * Options for upload operations.
 */
export type UploadOptions = {
  /**
   * The HTTP method to use.
   * @default 'POST'
   */
  httpMethod?: 'POST' | 'PUT' | 'PATCH';
  /**
   * The type of upload operation.
   * @default UploadType.BINARY_CONTENT
   */
  uploadType?: UploadType;
  /**
   * Custom headers to include in the request.
   */
  headers?: Record<string, string>;
  /**
   * The field name for the file in multipart uploads.
   * @default 'file'
   */
  fieldName?: string;
  /**
   * The MIME type of the file.
   */
  mimeType?: string;
  /**
   * Additional form parameters to include in multipart uploads.
   */
  parameters?: Record<string, string>;
  /**
   * Callback for upload progress updates.
   *
   * > **Note:** For multipart uploads, the reported bytes may include multipart framing overhead
   * > (boundary strings, headers, form parameters) in addition to the file content.
   */
  onProgress?: (data: UploadProgress) => void;
  /**
   * Determines whether the iOS native session should continue in the background.
   *
   * When set to `'background'`, the native transfer may continue after the app is
   * suspended. However, the JavaScript `UploadTask` instance is not
   * restored if the app is terminated or relaunched, so its promise, progress
   * callbacks, and cancellation state are only available while the original JS
   * runtime is still alive.
   *
   * @platform ios
   * @default 'background'
   */
  sessionType?: NetworkTaskSessionType;
  /**
   * An `AbortSignal` that can be used to cancel the upload.
   * When the signal is aborted, the upload is cancelled and the promise rejects with an `AbortError`.
   */
  signal?: AbortSignal;
};

/**
 * Options for download task operations.
 */
export type DownloadTaskOptions = {
  /**
   * Custom headers to include in the request.
   */
  headers?: Record<string, string>;
  /**
   * Determines whether the iOS native session should continue in the background.
   * Android accepts this option for API consistency and ignores it.
   *
   * When set to `'background'`, the native transfer may continue after the app is
   * suspended. However, the JavaScript `DownloadTask` instance is not
   * restored if the app is terminated or relaunched, so its promise, progress
   * callbacks, and cancellation state are only available while the original JS
   * runtime is still alive.
   *
   * @platform ios
   * @default 'background'
   */
  sessionType?: NetworkTaskSessionType;
  /**
   * Callback for download progress updates.
   */
  onProgress?: (data: DownloadProgress) => void;
  /**
   * AbortSignal to cancel the download.
   */
  signal?: AbortSignal;
};

/**
 * Represents the state of a paused download that can be persisted and resumed later.
 */
export type DownloadPauseState = {
  /**
   * The URL of the download.
   */
  url: string;
  /**
   * The destination file or directory URI.
   */
  fileUri: string;
  /**
   * Whether the destination is a directory. When `true`, the filename is derived from the URL.
   */
  isDirectory: boolean;
  /**
   * Custom headers that were used for the download request.
   */
  headers?: Record<string, string>;
  /**
   * Platform-specific opaque resume data.
   */
  resumeData?: string;
};

/**
 * Represents the current state of an upload or download task.
 * @inline
 * @hidden
 */
type TaskState = 'idle' | 'active' | 'paused' | 'completed' | 'cancelled' | 'error';

/**
 * Represents the current state of an upload task.
 */
export type UploadTaskState = Exclude<TaskState, 'paused'>;

/**
 * Represents the current state of a download task.
 */
export type DownloadTaskState = TaskState;

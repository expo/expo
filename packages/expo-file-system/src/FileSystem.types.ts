/**
 * These values can be used to define how sessions work on iOS.
 * @platform ios
 */
export enum FileSystemSessionType {
  /**
   * Using this mode means that the downloading/uploading session on the native side will work even if the application is moved to background.
   * If the task completes while the application is in background, the Promise will be either resolved immediately or (if the application execution has already been stopped) once the app is moved to foreground again.
   * > Note: The background session doesn't fail if the server or your connection is down. Rather, it continues retrying until the task succeeds or is canceled manually.
   */
  BACKGROUND = 0,
  /**
   * Using this mode means that downloading/uploading session on the native side will be terminated once the application becomes inactive (e.g. when it goes to background).
   * Bringing the application to foreground again would trigger Promise rejection.
   */
  FOREGROUND = 1,
}

export enum FileSystemUploadType {
  /**
   * The file will be sent as a request's body. The request can't contain additional data.
   */
  BINARY_CONTENT = 0,
  /**
   * An [RFC 2387-compliant](https://www.ietf.org/rfc/rfc2387.txt) request body. The provided file will be encoded into HTTP request.
   * This request can contain additional data represented by [`UploadOptionsMultipart`](#uploadoptionsmultipart) type.
   */
  MULTIPART = 1,
}

export type DownloadOptions = {
  /**
   * If `true`, include the MD5 hash of the file in the returned object. Provided for convenience since it is common to check the integrity of a file immediately after downloading.
   * @default false
   */
  md5?: boolean;
  // @docsMissing
  cache?: boolean;
  /**
   * An object containing all the HTTP header fields and their values for the download network request. The keys and values of the object are the header names and values respectively.
   */
  headers?: Record<string, string>;
  /**
   * A session type. Determines if tasks can be handled in the background. On Android, sessions always work in the background and you can't change it.
   * @default FileSystemSessionType.BACKGROUND
   * @platform ios
   */
  sessionType?: FileSystemSessionType;
};

export type FileSystemHttpResult = {
  /**
   * An object containing all the HTTP response header fields and their values for the download network request.
   * The keys and values of the object are the header names and values respectively.
   */
  headers: Record<string, string>;
  /**
   * The HTTP response status code for the download network request.
   */
  status: number;
  // @docsMissing
  mimeType: string | null;
};

export type FileSystemDownloadResult = FileSystemHttpResult & {
  /**
   * A `file://` URI pointing to the file. This is the same as the `fileUri` input parameter.
   */
  uri: string;
  /**
   * Present if the `md5` option was truthy. Contains the MD5 hash of the file.
   */
  md5?: string;
};

/**
 * @deprecated Use `FileSystemDownloadResult` instead.
 */
export type DownloadResult = FileSystemDownloadResult;

export type FileSystemUploadOptions = (UploadOptionsBinary | UploadOptionsMultipart) & {
  /**
   * An object containing all the HTTP header fields and their values for the upload network request.
   * The keys and values of the object are the header names and values respectively.
   */
  headers?: Record<string, string>;
  /**
   * The request method.
   * @default FileSystemAcceptedUploadHttpMethod.POST
   */
  httpMethod?: FileSystemAcceptedUploadHttpMethod;
  /**
   * A session type. Determines if tasks can be handled in the background. On Android, sessions always work in the background and you can't change it.
   * @default FileSystemSessionType.BACKGROUND
   * @platform ios
   */
  sessionType?: FileSystemSessionType;
};

/**
 * Upload options when upload type is set to binary.
 */
export type UploadOptionsBinary = {
  /**
   * Upload type determines how the file will be sent to the server.
   * Value will be `FileSystemUploadType.BINARY_CONTENT`.
   */
  uploadType?: FileSystemUploadType;
};

/**
 * Upload options when upload type is set to multipart.
 */
export type UploadOptionsMultipart = {
  /**
   * Upload type determines how the file will be sent to the server.
   * Value will be `FileSystemUploadType.MULTIPART`.
   */
  uploadType: FileSystemUploadType;
  /**
   * The name of the field which will hold uploaded file. Defaults to the file name without an extension.
   */
  fieldName?: string;
  /**
   * The MIME type of the provided file. If not provided, the module will try to guess it based on the extension.
   */
  mimeType?: string;
  /**
   * Additional form properties. They will be located in the request body.
   */
  parameters?: Record<string, string>;
};

export type FileSystemUploadResult = FileSystemHttpResult & {
  /**
   * The body of the server response.
   */
  body: string;
};

// @docsMissing
export type FileSystemNetworkTaskProgressCallback<
  T extends DownloadProgressData | UploadProgressData,
> = (data: T) => void;

/**
 * @deprecated use `FileSystemNetworkTaskProgressCallback<DownloadProgressData>` instead.
 */
export type DownloadProgressCallback = FileSystemNetworkTaskProgressCallback<DownloadProgressData>;

export type DownloadProgressData = {
  /**
   * The total bytes written by the download operation.
   */
  totalBytesWritten: number;
  /**
   * The total bytes expected to be written by the download operation. A value of `-1` means that the server did not return the `Content-Length` header
   * and the total size is unknown. Without this header, you won't be able to track the download progress.
   */
  totalBytesExpectedToWrite: number;
};

export type UploadProgressData = {
  /**
   * The total bytes sent by the upload operation.
   */
  totalBytesSent: number;
  /**
   * The total bytes expected to be sent by the upload operation.
   */
  totalBytesExpectedToSend: number;
};

export type DownloadPauseState = {
  /**
   * The remote URI to download from.
   */
  url: string;
  /**
   * The local URI of the file to download to. If there is no file at this URI, a new one is created. If there is a file at this URI, its contents are replaced.
   */
  fileUri: string;
  /**
   * Object representing the file download options.
   */
  options: DownloadOptions;
  /**
   * The string which allows the API to resume a paused download.
   */
  resumeData?: string;
};

export type FileInfo =
  /**
   * Object returned when file exist.
   */
  | {
      /**
       * Signifies that the requested file exist.
       */
      exists: true;
      /**
       * A `file://` URI pointing to the file. This is the same as the `fileUri` input parameter.
       */
      uri: string;
      /**
       * The size of the file in bytes. If operating on a source such as an iCloud file, only present if the `size` option was truthy.
       */
      size: number;
      /**
       * Boolean set to `true` if this is a directory and `false` if it is a file.
       */
      isDirectory: boolean;
      /**
       * The last modification time of the file expressed in seconds since epoch.
       */
      modificationTime: number;
      /**
       * Present if the `md5` option was truthy. Contains the MD5 hash of the file.
       */
      md5?: string;
    }
  /**
   * Object returned when file do not exist.
   */
  | {
      exists: false;
      uri: string;
      isDirectory: false;
    };

/**
 * These values can be used to define how file system data is read / written.
 */
export enum EncodingType {
  /**
   * Standard encoding format.
   */
  UTF8 = 'utf8',
  /**
   * Binary, radix-64 representation.
   */
  Base64 = 'base64',
}

// @docsMissing
export type FileSystemAcceptedUploadHttpMethod = 'POST' | 'PUT' | 'PATCH';

export type ReadingOptions = {
  /**
   * The encoding format to use when reading the file.
   * @default EncodingType.UTF8
   */
  encoding?: EncodingType | 'utf8' | 'base64';
  /**
   * Optional number of bytes to skip. This option is only used when `encoding: FileSystem.EncodingType.Base64` and `length` is defined.
   * */
  position?: number;
  /**
   * Optional number of bytes to read. This option is only used when `encoding: FileSystem.EncodingType.Base64` and `position` is defined.
   */
  length?: number;
};

export type WritingOptions = {
  /**
   * The encoding format to use when writing the file.
   * @default FileSystem.EncodingType.UTF8
   */
  encoding?: EncodingType | 'utf8' | 'base64';
};

export type DeletingOptions = {
  /**
   * If `true`, don't throw an error if there is no file or directory at this URI.
   * @default false
   */
  idempotent?: boolean;
};

export type InfoOptions = {
  /**
   * Whether to return the MD5 hash of the file.
   * @default false
   */
  md5?: boolean;
  /**
   * Explicitly specify that the file size should be included. For example, skipping this can prevent downloading the file if it's stored in iCloud.
   * The size is always returned for `file://` locations.
   */
  size?: boolean;
};

export type RelocatingOptions = {
  /**
   * URI or [SAF](#saf-uri) URI to the asset, file, or directory. See [supported URI schemes](#supported-uri-schemes).
   */
  from: string;
  /**
   * `file://` URI to the file or directory which should be its new location.
   */
  to: string;
};

export type MakeDirectoryOptions = {
  /**
   * If `true`, don't throw an error if there is no file or directory at this URI.
   * @default false
   */
  intermediates?: boolean;
};

// @docsMissing
export type ProgressEvent<T> = {
  uuid: string;
  data: T;
};

export type FileSystemRequestDirectoryPermissionsResult =
  /**
   * If the permissions were not granted.
   */
  | {
      granted: false;
    }
  /**
   * If the permissions were granted.
   */
  | {
      granted: true;
      /**
       * The [SAF URI](#saf-uri) to the user's selected directory. Available only if permissions were granted.
       */
      directoryUri: string;
    };

export type DirectoryCreateOptions = {
  /**
   * Whether to create intermediate directories if they do not exist.
   * @default false
   */
  intermediates?: boolean;
  /**
   * Whether to overwrite the directory if it exists.
   * @default false
   */
  overwrite?: boolean;
  /**
   * This flag controls whether the `create` operation is idempotent
   * (safe to call multiple times without error).
   *
   * If `true`, creating a file or directory that already exists will succeed silently.
   * If `false`, an error will be thrown when the target already exists.
   *
   * @default false
   */
  idempotent?: boolean;
};

export type DirectoryInfo = {
  /**
   * Indicates whether the directory exists.
   */
  exists: boolean;
  /**
   * A `file://` URI pointing to the directory.
   */
  uri?: string;
  /**
   * The size of the file in bytes.
   */
  size?: number;
  /**
   * The last modification time of the directory expressed in milliseconds since epoch.
   */
  modificationTime?: number;
  /**
   * A creation time of the directory expressed in milliseconds since epoch. Returns null if the Android version is earlier than API 26.
   */
  creationTime?: number;
  /**
   * A list of file names contained within a directory.
   */
  files?: string[];
};

/**
 * A string representing a file or directory url.
 */
export type URI = string;

/**
 * Represents a directory on the file system.
 */
export declare class Directory {
  /**
   * Creates an instance of a directory.
   * @param uri -  A `file:///` URI representing an arbitrary location on the file system. The location does not need to exist, or it may already contain a file.
   * @example
   * ```ts
   * const directory = new Directory("file:///path/to/directory");
   * ```
   */
  constructor(uri: string);

  /**
   * Represents the directory URI.
   */
  readonly uri: URI;

  /**
   * Validates a directory path.
   * @hidden This method is not meant to be used directly. It is called by the JS constructor.
   */
  validatePath(): void;

  /**
   * Deletes a directory.
   */
  delete(): void;

  /**
   * Checks if a directory exists.
   *
   * @returns `true` if the directory exists, `false` otherwise.
   */
  exists(): boolean;

  /**
   * Creates a directory.
   */
  create(): void;
  /**
   * Copies a directory.
   */
  copy(destination: Directory | File);
  /**
   * Moves a directory.
   */
  move(destination: Directory | File);
}

/**
 * Represents a file on the file system.
 */
export declare class File {
  /**
   * Creates an instance of File.
   *
   * @param uri - A `file:///` URI representing an arbitrary location on the file system. The location does not need to exist, or it may already contain a directory.
   */
  constructor(uri: URI);

  /**
   * Represents the file URI.
   */
  readonly uri: string;

  /**
   * Validates a directory path.
   * @hidden This method is not meant to be used directly. It is called by the JS constructor.
   */
  validatePath(): void;

  /**
   * Retrieves text from the file.
   * @returns The contents of the file as string.
   */
  text(): string;

  /**
   * Retrieves content of the file as base64.
   * @returns The contents of the file as a base64 string.
   */
  base64(): string;

  /**
   * Writes content to the file.
   * @param content - The content to write into the file.
   */
  write(content: string): void;

  /**
   * Deletes a file.
   */
  delete(): void;

  /**
   * Checks if a file exists.
   * @returns `true` if the file exists, `false` otherwise.
   */
  exists(): boolean;

  /**
   * Creates a file.
   */
  create(): void;

  /**
   * Copies a file.
   */
  copy(destination: Directory | File);

  /**
   * Moves a directory.
   */
  move(destination: Directory | File);

  /**
   * Downloads a file from the network.
   * @param url - The URL of the file to download.
   * @param destination - The destination directory or file. If a destination is provided, the resulting filename will be determined based on the response headers.
   * @returns A promise that resolves to the downloaded file.
   */
  static downloadFileAsync(url: string, destination: Directory | File): Promise<File>;
  /**
   * A size of the file in bytes. Returns null if the file does not exist or it cannot be read.
   */
  size: number | null;
  /**
   * An md5 hash of the file. Returns null if the file does not exist or it cannot be read.
   */
  md5: string | null;
}

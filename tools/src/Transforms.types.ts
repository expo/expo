/**
 * Basic string transform that describes what should be replaced in the input string.
 */
export type ReplaceTransform = {
  /**
   * A substring or RegExp matching a part of the input that you want to replace.
   */
  find: RegExp | string;

  /**
   * A string that replaces matched substrings in the input.
   */
  replaceWith: string | ((substring: string, ...args: any[]) => string);
};

export type RawTransform = {
  /**
   * Function that takes string as an argument and returns result of the transformations.
   */
  transform: (text: string) => string;
};

export type StringTransform = RawTransform | ReplaceTransform;

/**
 * A string transform extended by paths glob filter.
 */
export type FileTransform = StringTransform & {
  /**
   * An array of glob patterns matching files to which the transform should be applied.
   * Patterns without slashes will be matched against the basename of the path.
   */
  paths?: string | string[];

  /**
   * When truthy every transform that changes anything will print a diff
   * and wait for confirm to continue. If value is a string it will be used to identify
   * the transformation in the output
   */
  debug?: boolean | string;
};

/**
 * An object containing both file content transforms and path transforms.
 */
export type FileTransforms = {
  /**
   * An array of transforms to apply on each file's content.
   */
  content?: FileTransform[];

  /**
   * An array of transforms to apply on the relative file path.
   */
  path?: StringTransform[];
};

/**
 * An object with options passed to `copyFilesWithTransformsAsync` function.
 */
export type CopyFileOptions = {
  /**
   * Path of the file to copy, relative to `sourceDirectory`.
   */
  sourceFile: string;

  /**
   * A directory from which the files will be copied.
   */
  sourceDirectory: string;

  /**
   * A directory to which the transformed files will be copied.
   */
  targetDirectory: string;

  /**
   * An object with transform rules for file paths and contents.
   */
  transforms: FileTransforms;

  /**
   * Whether to keep original file mode (the mode for `chmod`), e.g. 755.
   */
  keepFileMode?: boolean;
};

/**
 * The result of copying the file.
 */
export type CopyFileResult = {
  /**
   * The final file content after transformations.
   */
  content: string;

  /**
   * The final target path after transformations. Relative to provided `targetDirectory`.
   */
  targetFile: string;
};

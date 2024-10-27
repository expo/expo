import type { Directory, File } from '../FileSystem';
import * as nodePath from './path';
import { fileURLToPath, isFileUrl, pathToFileURLString } from './url';

function uriObjectToString(path: string | File | Directory): string {
  return typeof path === 'string' ? path : path.uri;
}

export class PathUtilities {
  /**
   * Joins path segments into a single path.
   * @param paths - An array of path segments.
   * @returns A string representing the joined path.
   */
  static join(...paths: (string | File | Directory)[]): string {
    const stringPaths = paths.map(uriObjectToString);
    if (stringPaths[0] && isFileUrl(stringPaths[0])) {
      const [firstPath, ...rest] = stringPaths;
      return pathToFileURLString(nodePath.join(fileURLToPath(firstPath), ...rest));
    }
    return nodePath.join(...stringPaths);
  }

  /**
   * Resolves a relative path to an absolute path.
   * @param from - The base path.
   * @param to - The relative path.
   * @returns A string representing the resolved path.
   */
  static relative(from: string | File | Directory, to: string | File | Directory): string {
    const fromString = uriObjectToString(from);
    const toString = uriObjectToString(to);

    // If the first path is a file URL, convert it to a path
    if (isFileUrl(fromString)) {
      from = fileURLToPath(fromString);
    }
    // If the second path is a file URL, convert it to a path
    if (isFileUrl(toString)) {
      to = fileURLToPath(toString);
    }
    return nodePath.relative(fromString, toString);
  }

  /**
   * Checks if a path is absolute.
   * @param path - The path to check.
   * @returns `true` if the path is absolute, `false` otherwise.
   */
  static isAbsolute(path: string | File | Directory): boolean {
    const pathString = uriObjectToString(path);
    if (isFileUrl(pathString)) {
      return true;
    }
    return nodePath.isAbsolute(pathString);
  }

  /**
   * Normalizes a path.
   * @param path - The path to normalize.
   * @returns A string representing the normalized path.
   */
  static normalize(path: string | File | Directory): string {
    const pathString = uriObjectToString(path);
    if (isFileUrl(pathString)) {
      return pathToFileURLString(fileURLToPath(nodePath.normalize(pathString)));
    }
    return nodePath.normalize(pathString);
  }

  /**
   * Returns the directory name of a path.
   * @param path - The path to get the directory name from.
   * @returns A string representing the directory name.
   */
  static dirname(path: string | File | Directory): string {
    const pathString = uriObjectToString(path);
    if (isFileUrl(pathString)) {
      return pathToFileURLString(nodePath.dirname(fileURLToPath(pathString)));
    }
    return nodePath.dirname(pathString);
  }

  /**
   * Returns the base name of a path.
   * @param path - The path to get the base name from.
   * @param ext - An optional file extension.
   * @returns A string representing the base name.
   */
  static basename(path: string | File | Directory, ext?: string): string {
    const pathString = uriObjectToString(path);
    if (isFileUrl(pathString)) {
      return nodePath.basename(fileURLToPath(pathString), ext);
    }
    return nodePath.basename(pathString, ext);
  }

  /**
   * Returns the extension of a path.
   * @param path - The path to get the extension from.
   * @returns A string representing the extension.
   */
  static extname(path: string | File | Directory): string {
    const pathString = uriObjectToString(path);
    if (isFileUrl(pathString)) {
      return nodePath.extname(fileURLToPath(pathString));
    }
    return nodePath.extname(pathString);
  }

  /**
   * Parses a path into its components.
   * @param path - The path to parse.
   * @returns An object containing the parsed path components.
   */
  static parse(path: string | File | Directory): {
    root: string;
    dir: string;
    base: string;
    ext: string;
    name: string;
  } {
    const pathString = uriObjectToString(path);
    if (isFileUrl(pathString)) {
      return nodePath.parse(fileURLToPath(pathString));
    }
    return nodePath.parse(pathString);
  }
}

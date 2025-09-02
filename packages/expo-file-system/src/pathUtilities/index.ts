import type { Directory, File } from '../FileSystem';
import * as nodePath from './path';
import { asUrl, isUrl, encodeURLChars } from './url';

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
    const [firstSegment, ...rest] = paths.map(uriObjectToString);
    const pathAsUrl = asUrl(firstSegment);
    if (pathAsUrl) {
      pathAsUrl.pathname = nodePath.join(pathAsUrl.pathname, ...rest.map(encodeURLChars));
      return pathAsUrl.toString();
    }
    return nodePath.join(firstSegment, ...rest.map(encodeURLChars));
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
    if (isUrl(fromString)) {
      from = asUrl(fromString)!.pathname;
    }
    // If the second path is a file URL, convert it to a path
    if (isUrl(toString)) {
      to = asUrl(toString)!.pathname;
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
    if (isUrl(pathString)) {
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
    const pathURL = asUrl(encodeURLChars(pathString));
    if (pathURL) {
      pathURL.pathname = encodeURLChars(nodePath.normalize(decodeURIComponent(pathURL.pathname)));
      return pathURL.toString();
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
    const pathURL = asUrl(pathString);
    if (pathURL) {
      pathURL.pathname = encodeURLChars(nodePath.dirname(decodeURIComponent(pathURL.pathname)));
      return pathURL.toString();
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
    const pathURL = asUrl(pathString);
    if (pathURL) {
      return nodePath.basename(decodeURIComponent(pathURL.pathname));
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
    const pathURL = asUrl(pathString);
    if (pathURL) {
      return nodePath.extname(decodeURIComponent(pathURL.pathname));
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
    const pathURL = asUrl(pathString);
    if (pathURL) {
      return nodePath.parse(decodeURIComponent(pathURL.pathname));
    }
    return nodePath.parse(pathString);
  }
}

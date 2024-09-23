import * as nodePath from './path';
import { fileURLToPath, isFileUrl, pathToFileURLString } from './url';

type Path = string | { uri: string };

function uriObjectToString(path: Path): string {
  return typeof path === 'string' ? path : path.uri;
}

export class PathUtilities {
  static join(...paths: Path[]): string {
    const stringPaths = paths.map(uriObjectToString);
    if (stringPaths[0] && isFileUrl(stringPaths[0])) {
      const [firstPath, ...rest] = stringPaths;
      return pathToFileURLString(nodePath.join(fileURLToPath(firstPath), ...rest));
    }
    return nodePath.join(...stringPaths);
  }

  static relative(from: Path, to: Path): string {
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

  static isAbsolute(path: Path): boolean {
    const pathString = uriObjectToString(path);
    if (isFileUrl(pathString)) {
      return true;
    }
    return nodePath.isAbsolute(pathString);
  }

  static normalize(path: Path): string {
    const pathString = uriObjectToString(path);
    if (isFileUrl(pathString)) {
      return pathToFileURLString(fileURLToPath(nodePath.normalize(pathString)));
    }
    return nodePath.normalize(pathString);
  }

  static dirname(path: Path): string {
    const pathString = uriObjectToString(path);
    if (isFileUrl(pathString)) {
      return pathToFileURLString(nodePath.dirname(fileURLToPath(pathString)));
    }
    return nodePath.dirname(pathString);
  }

  static basename(path: Path, ext?: string): string {
    const pathString = uriObjectToString(path);
    if (isFileUrl(pathString)) {
      return nodePath.basename(fileURLToPath(pathString), ext);
    }
    return nodePath.basename(pathString, ext);
  }

  static extname(path: Path): string {
    const pathString = uriObjectToString(path);
    if (isFileUrl(pathString)) {
      return nodePath.extname(fileURLToPath(pathString));
    }
    return nodePath.extname(pathString);
  }

  static parse(path: Path): {
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

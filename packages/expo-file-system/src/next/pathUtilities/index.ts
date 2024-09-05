import * as nodePath from './path';
import { fileURLToPath, isFileUrl, pathToFileURLString } from './url';

export function join(...paths: string[]): string {
  if (paths[0] && isFileUrl(paths[0])) {
    const [firstPath, ...rest] = paths;
    return pathToFileURLString(nodePath.join(fileURLToPath(firstPath), ...rest));
  }
  return nodePath.join(...paths);
}

// relative
export function relative(from: string, to: string): string {
  // If the first path is a file URL, convert it to a path
  if (isFileUrl(from)) {
    from = fileURLToPath(from);
  }
  // If the second path is a file URL, convert it to a path
  if (isFileUrl(to)) {
    to = fileURLToPath(to);
  }
  return nodePath.relative(from, to);
}

export function isAbsolute(path: string): boolean {
  if (isFileUrl(path)) {
    return true;
  }
  return nodePath.isAbsolute(path);
}

export function normalize(path: string): string {
  if (isFileUrl(path)) {
    return pathToFileURLString(fileURLToPath(nodePath.normalize(path)));
  }
  return nodePath.normalize(path);
}

export function dirname(path: string): string {
  if (isFileUrl(path)) {
    return pathToFileURLString(nodePath.dirname(fileURLToPath(path)));
  }
  return nodePath.dirname(path);
}

export function basename(path: string, ext?: string): string {
  if (isFileUrl(path)) {
    return nodePath.basename(fileURLToPath(path), ext);
  }
  return nodePath.basename(path, ext);
}

export function parse(path: string): {
  root: string;
  dir: string;
  base: string;
  ext: string;
  name: string;
} {
  if (isFileUrl(path)) {
    return nodePath.parse(fileURLToPath(path));
  }
  return nodePath.parse(path);
}

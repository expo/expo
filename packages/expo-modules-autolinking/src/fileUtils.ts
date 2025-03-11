import fs from 'fs/promises';
import { glob, GlobOptions } from 'glob';
import path from 'path';

/**
 * A matching function that takes a file path and its contents and returns a string if it matches, or null otherwise.
 */
type MatchFunctor = (filePath: string, contents: Buffer) => string | null;

/**
 * Check if the file exists.
 */
export async function fileExistsAsync(file: string): Promise<boolean> {
  return (await fs.stat(file).catch(() => null))?.isFile() ?? false;
}

/**
 * Search files that match the glob pattern and return all matches from the matchFunctor.
 */
export async function globMatchFunctorAllAsync(
  globPattern: string,
  matchFunctor: MatchFunctor,
  options?: GlobOptions
): Promise<string[]> {
  const globStream = glob.stream(globPattern, { ...options, withFileTypes: false });
  const cwd = options?.cwd !== undefined ? `${options.cwd}` : process.cwd();
  const results: string[] = [];
  for await (const file of globStream) {
    let filePath = file.toString();
    if (!path.isAbsolute(filePath)) {
      filePath = path.resolve(cwd, filePath);
    }
    const contents = await fs.readFile(filePath);
    const matched = matchFunctor(filePath, contents);
    if (matched != null) {
      results.push(matched);
    }
  }
  return results;
}

/**
 * Search files that match the glob pattern and return the first match from the matchFunctor.
 */
export async function globMatchFunctorFirstAsync(
  globPattern: string,
  matchFunctor: MatchFunctor,
  options?: GlobOptions
): Promise<string | null> {
  const globStream = glob.stream(globPattern, { ...options, withFileTypes: false });
  const cwd = options?.cwd !== undefined ? `${options.cwd}` : process.cwd();
  for await (const file of globStream) {
    let filePath = file.toString();
    if (!path.isAbsolute(filePath)) {
      filePath = path.resolve(cwd, filePath);
    }
    const contents = await fs.readFile(filePath);
    const matched = matchFunctor(filePath, contents);
    if (matched != null) {
      return matched;
    }
  }
  return null;
}

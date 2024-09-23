import fs from 'fs';
import ignore from 'ignore';
import path from 'path';

/**
 * Checks if a file is ignored based on rules from a specified ignore file.
 * @param filePath The path to the file to check.
 * @param ignoreFilePath The path to the ignore file (.easignore or .gitignore).
 * @param rootPath The root path of the project.
 * @returns `true` if the file is ignored.
 */
export function isFileIgnoredByRules(
  filePath: string,
  ignoreFilePath: string,
  rootPath: string
): boolean {
  const ignoreContent = fs.readFileSync(ignoreFilePath, 'utf8');
  const ig = ignore().add(ignoreContent);

  const relativeFilePath = path.relative(rootPath, filePath);
  return ig.ignores(relativeFilePath);
}

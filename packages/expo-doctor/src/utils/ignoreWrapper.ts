import fg from 'fast-glob';
import fs from 'fs-extra';
import createIgnore, { Ignore as SingleFileIgnore } from 'ignore';
import path from 'path';

const EASIGNORE_FILENAME = '.easignore';
const GITIGNORE_FILENAME = '.gitignore';

const DEFAULT_IGNORE = `
.git
node_modules
`;

/**
 * Ignore wraps the 'ignore' package to support multiple .gitignore files
 * in subdirectories.
 *
 * Inconsistencies with git behavior:
 * - if parent .gitignore has ignore rule and child has exception to that rule,
 *   file will still be ignored,
 * - node_modules is always ignored,
 * - if .easignore exists, .gitignore files are not used.
 */
export class Ignore {
  private ignoreMapping: (readonly [string, SingleFileIgnore])[] = [];

  constructor(private readonly rootDir: string) {}

  public async initIgnoreAsync(): Promise<void> {
    const easIgnorePath = path.join(this.rootDir, EASIGNORE_FILENAME);
    if (await fs.pathExists(easIgnorePath)) {
      this.ignoreMapping = [
        ['', createIgnore().add(DEFAULT_IGNORE)],
        ['', createIgnore().add(await fs.readFile(easIgnorePath, 'utf-8'))],
      ];
      return;
    }
    const ignoreFilePaths = (
      await fg(`**/${GITIGNORE_FILENAME}`, {
        cwd: this.rootDir,
        ignore: ['node_modules'],
        followSymbolicLinks: false,
      })
    )
      // ensure that parent dir is before child directories
      .sort((a, b) => a.length - b.length && a.localeCompare(b));

    const ignoreMapping = await Promise.all(
      ignoreFilePaths.map(async (filePath) => {
        return [
          filePath.slice(0, filePath.length - GITIGNORE_FILENAME.length),
          createIgnore().add(await fs.readFile(path.join(this.rootDir, filePath), 'utf-8')),
        ] as const;
      })
    );
    this.ignoreMapping = [['', createIgnore().add(DEFAULT_IGNORE)], ...ignoreMapping];
  }

  public ignores(relativePath: string): boolean {
    for (const [prefix, ignore] of this.ignoreMapping) {
      if (relativePath.startsWith(prefix) && ignore.ignores(relativePath.slice(prefix.length))) {
        return true;
      }
    }
    return false;
  }
}

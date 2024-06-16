import spawnAsync from '@expo/spawn-async';
import fg from 'fast-glob';
import fs from 'fs/promises';
import createIgnore, { Ignore as SingleFileIgnore } from 'ignore';
import path from 'path';

export interface Client {
  getRootPathAsync(): Promise<string>;
  isFileIgnoredAsync(filePath: string): Promise<boolean>;
}

export default async function getVCSClientAsync(projectDir: string): Promise<Client> {
  if (await isGitInstalledAndConfiguredAsync()) {
    return new GitClient();
  } else {
    return new NoVCSClient(projectDir);
  }
}

class GitClient implements Client {
  public async getRootPathAsync(): Promise<string> {
    return (await spawnAsync('git', ['rev-parse', '--show-toplevel'])).stdout.trim();
  }

  async isFileIgnoredAsync(filePath: string): Promise<boolean> {
    try {
      await spawnAsync('git', ['check-ignore', '-q', filePath], {
        cwd: path.normalize(await this.getRootPathAsync()),
      });
      return true;
    } catch {
      return false;
    }
  }
}

class NoVCSClient implements Client {
  constructor(private readonly projectDir: string) {}

  async getRootPathAsync(): Promise<string> {
    return this.projectDir;
  }

  async isFileIgnoredAsync(filePath: string): Promise<boolean> {
    const ignore = new Ignore(this.projectDir);
    await ignore.initIgnoreAsync();
    return ignore.ignores(filePath);
  }
}

async function isGitInstalledAndConfiguredAsync(): Promise<boolean> {
  try {
    await spawnAsync('git', ['--help']);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }

  try {
    await spawnAsync('git', ['rev-parse', '--show-toplevel']);
  } catch {
    return false;
  }

  return true;
}

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
 * - node_modules is always ignored
 *
 * Differs from the eas-cli Ignore class by not using `.easignore`. Otherwise this is copied. May try
 * to merge the implementations soon.
 */
class Ignore {
  private ignoreMapping: (readonly [string, SingleFileIgnore])[] = [];

  constructor(private rootDir: string) {}

  public async initIgnoreAsync(): Promise<void> {
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

import spawnAsync from '@expo/spawn-async';
import fs from 'fs';
import ignore from 'ignore';
import os from 'os';
import path from 'path';
import { resolveWorkspaceRootAsync } from 'resolve-workspace-root';

const debug = require('debug')('expo:doctor:ignore');

const maybeStat = (targetPath: string): Promise<fs.Stats | null> =>
  fs.promises.stat(path.resolve(targetPath)).catch(() => null);

async function getGitTopLevelAsync(root = process.cwd()): Promise<string | null> {
  try {
    const output = await spawnAsync('git', ['rev-parse', '--show-toplevel'], { cwd: root });
    const gitRoot = path.resolve(output.stdout.trim());
    debug(`Found git rev-parse root candidate: ${gitRoot}`);
    return (await maybeStat(gitRoot))?.isDirectory() ? gitRoot : null;
  } catch {
    return null;
  }
}

async function getGitRootPathAsync(root = process.cwd()): Promise<string | null> {
  const homeDir = path.normalize(os.homedir());
  for (let dir = root; path.dirname(dir) !== dir; dir = path.dirname(dir)) {
    if ((await maybeStat(path.join(dir, '.git')))?.isDirectory()) {
      debug(`Found .git root candidate: ${dir}`);
      return dir;
    }
    if (dir === homeDir) break;
  }
  return null;
}

async function getRootPathAsync(root = process.cwd()): Promise<string> {
  const rootPath =
    (await getGitTopLevelAsync(root)) ||
    (await getGitRootPathAsync(root)) ||
    (await resolveWorkspaceRootAsync(root)) ||
    root;
  debug(`Using root path: ${rootPath}`);
  return rootPath;
}

export interface IgnoreFiles {
  eas?(targetPath: string): boolean;
  git?(targetPath: string): boolean;
}

interface IgnoreFile {
  fromPath: string;
  ignores(filePath: string): boolean;
}

const ignoreFileNames = {
  eas: '.easignore',
  git: '.gitignore',
} as const;

export async function parseIgnoreFiles(root = process.cwd()): Promise<IgnoreFiles> {
  const result: Record<keyof IgnoreFiles, IgnoreFile[]> = {
    eas: [],
    git: [],
  };
  // We check for ignore files up until the repository root
  const parentRoot = await getRootPathAsync(root);
  for (let dir = root; path.dirname(dir) !== dir; dir = path.dirname(dir)) {
    // Each directory is checked for all ignore filenames and categorised
    for (const key in ignoreFileNames) {
      const ignoreKey = key as keyof IgnoreFiles;
      const ignoreFileName = ignoreFileNames[ignoreKey];
      const ignoreFilePath = path.resolve(dir, ignoreFileName);
      try {
        const contents = await fs.promises.readFile(ignoreFilePath, 'utf8');
        if (contents) {
          // If we find an ignore file, we parse it and store its dirname
          debug(`Found ${ignoreFileName} file: ${ignoreFilePath}`);
          const ignoreFile = ignore().add(contents);
          result[ignoreKey].push({
            fromPath: dir,
            ignores: ignoreFile.createFilter(),
          });
        }
      } catch {
        // ignore if file can't be read
      }
    }
    if (dir === parentRoot) break;
  }
  const makeIgnoreCheck = (ignores: IgnoreFile[]) => {
    if (ignores.length === 0) {
      return undefined;
    }
    return (filePath: string) => {
      // We have to check ignore files one-by-one with relative paths
      const resolvedPath = path.resolve(root, filePath);
      return ignores.some((ignore) => {
        const relativePath = path.relative(ignore.fromPath, resolvedPath);
        return ignore.ignores(relativePath) || ignore.ignores(`${relativePath}/`);
      });
    };
  };
  return {
    eas: makeIgnoreCheck(result.eas),
    git: makeIgnoreCheck(result.git),
  };
}

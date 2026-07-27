import spawnAsync from '@expo/spawn-async';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { resolveWorkspaceRootAsync } from 'resolve-workspace-root';

const maybeStat = (targetPath: string): Promise<fs.Stats | null> =>
  fs.promises.stat(path.resolve(targetPath)).catch(() => null);

async function getGitTopLevelAsync(root = process.cwd()): Promise<string | null> {
  try {
    const output = await spawnAsync('git', ['rev-parse', '--show-toplevel'], { cwd: root });
    const gitRoot = path.resolve(output.stdout.trim());
    return (await maybeStat(gitRoot))?.isDirectory() ? gitRoot : null;
  } catch {
    return null;
  }
}

async function getGitRootPathAsync(root = process.cwd()): Promise<string | null> {
  const homeDir = path.normalize(os.homedir());
  for (let dir = root; path.dirname(dir) !== dir; dir = path.dirname(dir)) {
    if ((await maybeStat(path.join(dir, '.git')))?.isDirectory()) {
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
    process.cwd();
  return rootPath;
}

/** Finds a Gemfile in the target directory or a parent, stopping at the Git or workspace root. */
export async function findGemfile(root = process.cwd()): Promise<string | null> {
  const rootBoundary = path.normalize(await getRootPathAsync(root));
  for (let dir = root; path.dirname(dir) !== dir; dir = path.dirname(dir)) {
    const candidate = path.join(dir, 'Gemfile');
    if ((await maybeStat(candidate))?.isFile()) {
      return candidate;
    }
    if (dir === rootBoundary) break;
  }
  return null;
}

/**
 * Check if the project uses Bundler to manage CocoaPods.
 * Returns `true` if a `Gemfile` exists in the project root (or a parent)
 * that lists `cocoapods` as a dependency, and `bundle exec pod --version` succeeds.
 */
export async function isUsingBundlerAsync(projectRoot: string): Promise<boolean> {
  const gemfilePath = await findGemfile(projectRoot);
  if (!gemfilePath) {
    return false;
  }
  const [gemfileContents, podExec] = await Promise.allSettled([
    fs.promises.readFile(gemfilePath, 'utf8'),
    spawnAsync('bundle', ['exec', 'pod', '--version'], {
      cwd: projectRoot,
      stdio: 'ignore',
    }),
  ]);
  if (gemfileContents.status === 'rejected' || podExec.status === 'rejected') {
    return false;
  } else {
    return /gem\s*\(?\s*(?:'cocoapods'|"cocoapods")/.test(gemfileContents.value);
  }
}

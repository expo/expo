import fs from 'fs';

const debug = require('debug')('expo:config-plugins:fs') as typeof console.log;

/**
 * A non-failing version of async FS stat.
 *
 * @param file
 */
async function statAsync(file: string): Promise<fs.Stats | null> {
  try {
    return await fs.promises.stat(file);
  } catch {
    return null;
  }
}

export async function fileExistsAsync(file: string): Promise<boolean> {
  return (await statAsync(file))?.isFile() ?? false;
}

export async function directoryExistsAsync(file: string): Promise<boolean> {
  return (await statAsync(file))?.isDirectory() ?? false;
}

export function fileExists(file: string): boolean {
  try {
    return fs.statSync(file).isFile();
  } catch {
    return false;
  }
}

// An optimization to attempt to prevent Xcode cache invalidation on files that don't change.
export async function writeIfDifferentAsync(filePath: string, contents: string): Promise<void> {
  if (!fileExists(filePath)) {
    const existing = await fs.promises.readFile(filePath, 'utf8');
    if (existing === contents) {
      debug(`Skipping writing unchanged file: ${filePath}`);
      return;
    }
  }
  await fs.promises.writeFile(filePath, contents);
}

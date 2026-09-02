import fs from 'fs';

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
    const stat = fs.lstatSync(file, { throwIfNoEntry: false });
    if (!stat) {
      return false;
    } else if (stat.isFile()) {
      return true;
    } else if (stat.isSymbolicLink()) {
      return isRealpathFileSync(file);
    } else {
      return false;
    }
  } catch {
    return false;
  }
}

function isRealpathFileSync(target: string): boolean {
  try {
    const realpath = fs.realpathSync(target);
    return !!fs.lstatSync(realpath, { throwIfNoEntry: false })?.isFile();
  } catch {
    return false;
  }
}

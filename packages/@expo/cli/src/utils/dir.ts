import fs from 'fs-extra';

export function directoryExistsSync(file: string): boolean {
  try {
    return fs.statSync(file)?.isDirectory() ?? false;
  } catch {
    return false;
  }
}

export async function directoryExistsAsync(file: string): Promise<boolean> {
  return (await fs.promises.stat(file).catch(() => null))?.isDirectory() ?? false;
}

export async function fileExistsAsync(file: string): Promise<boolean> {
  return (await fs.promises.stat(file).catch(() => null))?.isFile() ?? false;
}

export const ensureDirectoryAsync = (path: string) => fs.promises.mkdir(path, { recursive: true });

export const ensureDirectory = (path: string) => fs.mkdirSync(path, { recursive: true });

export const copySync = fs.copySync;

export const copyAsync = fs.copy;

export const removeAsync = fs.remove;

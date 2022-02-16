import fs from 'fs-extra';

export async function directoryExistsAsync(file: string): Promise<boolean> {
  return (await fs.promises.stat(file).catch(() => null))?.isDirectory() ?? false;
}

export async function fileExistsAsync(file: string): Promise<boolean> {
  return (await fs.promises.stat(file).catch(() => null))?.isFile() ?? false;
}

export const removeAsync = fs.remove;

export const ensureDirectoryAsync = fs.ensureDir;

export const copySync = fs.copySync;

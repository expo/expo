import fs from 'fs';
import fse from 'fs-extra';

export function fileExistsSync(file: string): boolean {
  return !!fs
    .statSync(file, {
      throwIfNoEntry: false,
    })
    ?.isFile();
}

export function directoryExistsSync(file: string): boolean {
  return !!fs
    .statSync(file, {
      throwIfNoEntry: false,
    })
    ?.isDirectory();
}

export async function directoryExistsAsync(file: string): Promise<boolean> {
  return (await fs.promises.stat(file).catch(() => null))?.isDirectory() ?? false;
}

export async function fileExistsAsync(file: string): Promise<boolean> {
  return (await fs.promises.stat(file).catch(() => null))?.isFile() ?? false;
}

export const ensureDirectoryAsync = (path: string) => fs.promises.mkdir(path, { recursive: true });

export const ensureDirectory = (path: string) => fse.mkdirSync(path, { recursive: true });

export const copySync = fse.copySync;

export const copyAsync = fse.copy;

export const removeAsync = fse.remove;

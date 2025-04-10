import fs from 'fs';
import path from 'path';

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

export const ensureDirectory = (path: string): void => {
  fs.mkdirSync(path, {
    recursive: true,
  });
};

export const copySync = (src: string, dest: string): void => {
  const destParent = path.dirname(dest);
  if (!fs.existsSync(destParent)) ensureDirectory(destParent);
  fs.cpSync(src, dest, {
    recursive: true,
    force: true,
  });
};

export const copyAsync = async (src: string, dest: string): Promise<void> => {
  const destParent = path.dirname(dest);
  if (!fs.existsSync(destParent)) {
    await fs.promises.mkdir(destParent, { recursive: true });
  }
  await fs.promises.cp(src, dest, {
    recursive: true,
    force: true,
  });
};

export const removeAsync = (path: string): Promise<void> => {
  return fs.promises.rm(path, {
    recursive: true,
    force: true,
  });
};

import fs from 'fs-extra';

export async function directoryExistsAsync(file: string): Promise<boolean> {
  return (await fs.promises.stat(file).catch(() => null))?.isDirectory() ?? false;
}

export const ensureDirectoryAsync = (path: string) => fs.promises.mkdir(path, { recursive: true });

export const moveAsync = fs.move;

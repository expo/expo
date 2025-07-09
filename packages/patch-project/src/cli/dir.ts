import fs from 'fs';
import path from 'path';

export async function directoryExistsAsync(file: string): Promise<boolean> {
  return (await fs.promises.stat(file).catch(() => null))?.isDirectory() ?? false;
}

export async function ensureDirectoryAsync(path: string): Promise<void> {
  await fs.promises.mkdir(path, { recursive: true });
}

export async function moveAsync(src: string, dest: string): Promise<void> {
  // First, remove target, so there are no conflicts (explicit overwrite)
  await fs.promises.rm(dest, { force: true, recursive: true });
  // Then, make sure that the target parent directory exists
  await fs.promises.mkdir(path.dirname(dest), { recursive: true });
  try {
    // Then, rename the file to move it to the destination
    await fs.promises.rename(src, dest);
  } catch (error: any) {
    if (error.code === 'EXDEV') {
      // If the file is on a different device/disk, copy it instead and delete the original
      await fs.promises.cp(src, dest, { errorOnExist: true, recursive: true });
      await fs.promises.rm(src, { recursive: true, force: true });
    } else {
      throw error;
    }
  }
}

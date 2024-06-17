import fs from 'fs/promises';

/**
 * Check if the file exists.
 */
export async function fileExistsAsync(file: string): Promise<boolean> {
  return (await fs.stat(file).catch(() => null))?.isFile() ?? false;
}

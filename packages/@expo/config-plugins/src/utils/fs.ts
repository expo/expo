import fs from 'fs';
import path from 'path';

/** A basic function that copies a single file to another file location. */
export async function copyFilePathToPathAsync(src: string, dest: string): Promise<void> {
  const srcFile = await fs.promises.readFile(src);
  await fs.promises.mkdir(path.dirname(dest), { recursive: true });
  await fs.promises.writeFile(dest, srcFile);
}

/** Remove a single file (not directory). Returns `true` if a file was actually deleted. */
export function removeFile(filePath: string): boolean {
  try {
    fs.unlinkSync(filePath);
    return true;
  } catch (error: any) {
    // Skip if the remove did nothing.
    if (error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

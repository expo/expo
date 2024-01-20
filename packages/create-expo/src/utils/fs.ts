import fs from 'fs';

export async function fileExistsAsync(path: string): Promise<boolean> {
  try {
    const stat = await fs.promises.stat(path);
    return stat.isFile();
  } catch {
    return false;
  }
}

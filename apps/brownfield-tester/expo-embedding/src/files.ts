import { lstat, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

export async function readText(path: string): Promise<string> {
  return readFile(path, 'utf8');
}

export async function readJSON(path: string) {
  return JSON.parse(await readText(path));
}

export async function writeGenerated(path: string, contents: string): Promise<void> {
  if ((await exists(path)) && (await readText(path)) === contents) return;
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, contents);
}

export async function lstatIfExists(path: string) {
  try {
    return await lstat(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }
}

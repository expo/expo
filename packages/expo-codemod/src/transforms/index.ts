import path from 'path';
import { glob } from 'tinyglobby';

export const TRANSFORM_DIR = __dirname;

export async function listTransformsAsync(): Promise<string[]> {
  // *.js, since this function will be called from within build folder
  const modules = await glob(['*.js'], { cwd: TRANSFORM_DIR });
  return modules
    .map((filename) => path.basename(filename, '.js'))
    .filter((name) => name !== 'index')
    .sort();
}

export function transformFilePath(transform: string): string {
  return path.join(TRANSFORM_DIR, `${transform}.js`);
}

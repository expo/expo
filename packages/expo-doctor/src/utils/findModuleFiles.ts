import { glob } from 'node:fs/promises';
import path from 'node:path';

export async function findModuleFilesAsync(projectRoot: string): Promise<string[]> {
  const files: string[] = [];
  for await (const file of glob(['modules/**/ios/*.podspec', 'modules/**/android/build.gradle'], {
    cwd: projectRoot,
  })) {
    files.push(path.resolve(projectRoot, file));
  }
  return files;
}

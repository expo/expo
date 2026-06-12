import { error } from 'console';
import fs from 'fs';
import path from 'path';

import type { InlineModulesMirror } from './inlineModules';
import { taskAll } from '../concurrency';

export async function createSymlinksToKotlinFiles(
  mirrorPath: string,
  inlineModulesMirror: InlineModulesMirror
) {
  const kotlinFiles = inlineModulesMirror.files.filter(({ filePath }) => filePath.endsWith('.kt'));

  await taskAll(kotlinFiles, async ({ filePath, watchedDir }) => {
    const filePathRelativeToWatchedDir = path.relative(watchedDir, filePath);
    const targetPath = path.resolve(mirrorPath, filePathRelativeToWatchedDir);

    try {
      await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.promises.symlink(filePath, targetPath);
    } catch (e) {
      error(`Couldn't symlink inline module: ${filePath}. Error: ${e}`);
    }
  });
}

export function getClassName(classNameWithPackage: string): string {
  const index = classNameWithPackage.lastIndexOf('.');
  if (index < 0) {
    return classNameWithPackage;
  }
  return classNameWithPackage.substring(index + 1);
}

export async function generateInlineModulesListFile(
  inlineModulesListPath: string,
  inlineModulesMirror: InlineModulesMirror
) {
  const fileContent = `package inline.modules

import expo.modules.kotlin.ModulesProvider
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.services.Service

class ExpoInlineModulesList : ModulesProvider {
  override fun getModulesMap(): Map<Class<out Module>, String?> {
    return mapOf(
${inlineModulesMirror.kotlinClasses
  .map((moduleClass) => `      ${moduleClass}::class.java to "${getClassName(moduleClass)}"`)
  .join(',\n')}
    )
  }

  override fun getServices(): List<Class<out Service>> {
    return emptyList()
  }
}
`;

  await fs.promises.mkdir(inlineModulesListPath, { recursive: true });
  await fs.promises.writeFile(
    path.resolve(inlineModulesListPath, 'ExpoInlineModulesList.kt'),
    fileContent
  );
}

import fs from 'fs';
import path from 'path';

import { getMirrorStateObject } from './inlineModules';
import { taskAll } from '../concurrency';

export async function createSymlinksToKotlinFiles(
  mirrorPath: string,
  watchedDirectories: string[]
) {
  const inlineModulesObject = await getMirrorStateObject(watchedDirectories);
  const kotlinFiles = inlineModulesObject.files.filter(({ filePath }) => filePath.endsWith('.kt'));

  await taskAll(kotlinFiles, async ({ filePath, watchedDirRoot }) => {
    const filePathRelativeToWatchedDirRoot = path.relative(watchedDirRoot, filePath);
    const targetPath = path.resolve(mirrorPath, filePathRelativeToWatchedDirRoot);

    await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.promises.symlink(filePath, targetPath);
  });
}

function getClassName(classNameWithPackage: string): string {
  const index = classNameWithPackage.lastIndexOf('.');
  if (index < 0) {
    return classNameWithPackage;
  }
  return classNameWithPackage.substring(index + 1);
}

export async function generateInlineModulesListFile(
  inlineModulesListPath: string,
  watchedDirectories: string[]
) {
  const inlineModulesObject = await getMirrorStateObject(watchedDirectories);
  const fileContent = `package inline.modules;

import org.jetbrains.annotations.NotNull;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import expo.modules.kotlin.ModulesProvider;
import expo.modules.kotlin.modules.Module;
import expo.modules.kotlin.services.Service;

public class ExpoInlineModulesList implements ModulesProvider {

  @Override
  public Map<Class<? extends Module>, String> getModulesMap() {
    return Map.of(
${inlineModulesObject.kotlinClasses
  .map((moduleClass) => `      ${moduleClass}.class, "${getClassName(moduleClass)}"`)
  .join(',\n')}
    );
  }

  @Override
  public List<Class<? extends @NotNull Service>> getServices() {
    return new ArrayList<>();
  }
}

`;

  await fs.promises.mkdir(inlineModulesListPath, { recursive: true });
  await fs.promises.writeFile(
    path.resolve(inlineModulesListPath, 'ExpoInlineModulesList.java'),
    fileContent
  );
}

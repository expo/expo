import fs from 'fs';
import path from 'path';

import { getMirrorStateObject } from './localModules';

export async function createSymlinksToKotlinFiles(mirrorPath: string, watchedDirs: string[]) {
  const localModulesObject = await getMirrorStateObject(watchedDirs);

  for (const { filePath, watchedDirRoot } of localModulesObject.files) {
    if (!filePath.endsWith('.kt')) {
      continue;
    }
    const filePathRelativeToWatchedDirRoot = path.relative(watchedDirRoot, filePath);
    const targetPath = path.resolve(mirrorPath, filePathRelativeToWatchedDirRoot);

    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.symlinkSync(filePath, targetPath);
  }
}

function getClassName(classNameWithPackage: string): string {
  const index = classNameWithPackage.lastIndexOf('.');
  if (index < 0 || index > classNameWithPackage.length) {
    return classNameWithPackage;
  }
  return classNameWithPackage.substring(index + 1);
}

export async function generateLocalModulesListFile(
  localModulesListPath: string,
  watchedDirs: string[]
) {
  const localModulesObject = await getMirrorStateObject(watchedDirs);
  const fileContent = `package local.modules;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import expo.modules.kotlin.ModulesProvider;
import expo.modules.kotlin.modules.Module;

public class ExpoLocalModulesList implements ModulesProvider {

  @Override
  public Map<Class<? extends Module>, String> getModulesMap() {
    return Map.of(
${localModulesObject.kotlinClasses.map((moduleClass) => `      ${moduleClass}.class, "${getClassName(moduleClass)}"`).join(',\n')}
    );
  }

}

`;

  fs.mkdirSync(localModulesListPath, { recursive: true });
  fs.writeFileSync(path.resolve(localModulesListPath, 'ExpoLocalModulesList.java'), fileContent);
}

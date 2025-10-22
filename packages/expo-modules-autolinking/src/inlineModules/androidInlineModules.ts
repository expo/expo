import fs from 'fs';
import path from 'path';

import { getMirrorStateObject } from './inlineModules';

export async function createSymlinksToKotlinFiles(mirrorPath: string, watchedDirs: string[]) {
  const inlineModulesObject = await getMirrorStateObject(watchedDirs);

  for (const { filePath, watchedDirRoot } of inlineModulesObject.files) {
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

export async function generateInlineModulesListFile(
  inlineModulesListPath: string,
  watchedDirs: string[]
) {
  const inlineModulesObject = await getMirrorStateObject(watchedDirs);
  const fileContent = `package inline.modules;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import expo.modules.kotlin.ModulesProvider;
import expo.modules.kotlin.modules.Module;

public class ExpoInlineModulesList implements ModulesProvider {

  @Override
  public Map<Class<? extends Module>, String> getModulesMap() {
    return Map.of(
${inlineModulesObject.kotlinClasses.map((moduleClass) => `      ${moduleClass}.class, "${getClassName(moduleClass)}"`).join(',\n')}
    );
  }

}

`;

  fs.mkdirSync(inlineModulesListPath, { recursive: true });
  fs.writeFileSync(path.resolve(inlineModulesListPath, 'ExpoInlineModulesList.java'), fileContent);
}

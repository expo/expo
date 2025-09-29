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

export async function generateLocalModulesListFile(
  localModulesListPath: string,
  watchedDirs: string[]
) {
  const localModulesObject = await getMirrorStateObject(watchedDirs);
  const fileContent = `
package local.modules;

import java.util.Arrays;
import java.util.List;

import expo.modules.kotlin.ModulesProvider;
import expo.modules.kotlin.modules.Module;

public class ExpoLocalModulesList implements ModulesProvider {
  @Override
  public List<Class<? extends Module>> getModulesList() {
    return Arrays.<Class<? extends Module>>asList(
${localModulesObject.kotlinClasses.map((moduleClass) => `      ${moduleClass}.class`).join(',\n')}
    );
  }
}
`;

  fs.mkdirSync(localModulesListPath, { recursive: true });
  fs.writeFileSync(path.resolve(localModulesListPath, 'ExpoLocalModulesList.java'), fileContent);
}

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSymlinksToKotlinFiles = createSymlinksToKotlinFiles;
exports.generateLocalModulesListFile = generateLocalModulesListFile;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const localModules_1 = require("./localModules");
async function createSymlinksToKotlinFiles(mirrorPath, watchedDirs) {
    const localModulesObject = await (0, localModules_1.getMirrorStateObject)(watchedDirs);
    for (const { filePath, watchedDirRoot } of localModulesObject.files) {
        if (!filePath.endsWith('.kt')) {
            continue;
        }
        const filePathRelativeToWatchedDirRoot = path_1.default.relative(watchedDirRoot, filePath);
        const targetPath = path_1.default.resolve(mirrorPath, filePathRelativeToWatchedDirRoot);
        fs_1.default.mkdirSync(path_1.default.dirname(targetPath), { recursive: true });
        fs_1.default.symlinkSync(filePath, targetPath);
    }
}
function getClassName(classNameWithPackage) {
    const index = classNameWithPackage.lastIndexOf('.');
    if (index < 0 || index > classNameWithPackage.length) {
        return classNameWithPackage;
    }
    return classNameWithPackage.substring(index + 1);
}
async function generateLocalModulesListFile(localModulesListPath, watchedDirs) {
    const localModulesObject = await (0, localModules_1.getMirrorStateObject)(watchedDirs);
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
    fs_1.default.mkdirSync(localModulesListPath, { recursive: true });
    fs_1.default.writeFileSync(path_1.default.resolve(localModulesListPath, 'ExpoLocalModulesList.java'), fileContent);
}
//# sourceMappingURL=androidLocalModules.js.map
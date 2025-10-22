"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSymlinksToKotlinFiles = createSymlinksToKotlinFiles;
exports.generateInlineModulesListFile = generateInlineModulesListFile;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const inlineModules_1 = require("./inlineModules");
async function createSymlinksToKotlinFiles(mirrorPath, watchedDirs) {
    const inlineModulesObject = await (0, inlineModules_1.getMirrorStateObject)(watchedDirs);
    for (const { filePath, watchedDirRoot } of inlineModulesObject.files) {
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
async function generateInlineModulesListFile(inlineModulesListPath, watchedDirs) {
    const inlineModulesObject = await (0, inlineModules_1.getMirrorStateObject)(watchedDirs);
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
    fs_1.default.mkdirSync(inlineModulesListPath, { recursive: true });
    fs_1.default.writeFileSync(path_1.default.resolve(inlineModulesListPath, 'ExpoInlineModulesList.java'), fileContent);
}
//# sourceMappingURL=androidInlineModules.js.map
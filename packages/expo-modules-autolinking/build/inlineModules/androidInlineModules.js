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
async function createSymlinksToKotlinFiles(mirrorPath, watchedDirectories) {
    const inlineModulesObject = await (0, inlineModules_1.getMirrorStateObject)(watchedDirectories);
    for (const { filePath, watchedDirRoot } of inlineModulesObject.files) {
        if (!filePath.endsWith('.kt')) {
            continue;
        }
        const filePathRelativeToWatchedDirRoot = path_1.default.relative(watchedDirRoot, filePath);
        const targetPath = path_1.default.resolve(mirrorPath, filePathRelativeToWatchedDirRoot);
        await fs_1.default.promises.mkdir(path_1.default.dirname(targetPath), { recursive: true });
        await fs_1.default.promises.symlink(filePath, targetPath);
    }
}
function getClassName(classNameWithPackage) {
    const index = classNameWithPackage.lastIndexOf('.');
    if (index < 0 || index > classNameWithPackage.length) {
        return classNameWithPackage;
    }
    return classNameWithPackage.substring(index + 1);
}
async function generateInlineModulesListFile(inlineModulesListPath, watchedDirectories) {
    const inlineModulesObject = await (0, inlineModules_1.getMirrorStateObject)(watchedDirectories);
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
${inlineModulesObject.kotlinClasses.map((moduleClass) => `      ${moduleClass}.class, "${getClassName(moduleClass)}"`).join(',\n')}
    );
  }

  @Override
  public List<Class<? extends @NotNull Service>> getServices() {
    return new ArrayList<>();
  }
}

`;
    await fs_1.default.promises.mkdir(inlineModulesListPath, { recursive: true });
    await fs_1.default.promises.writeFile(path_1.default.resolve(inlineModulesListPath, 'ExpoInlineModulesList.java'), fileContent);
}
//# sourceMappingURL=androidInlineModules.js.map
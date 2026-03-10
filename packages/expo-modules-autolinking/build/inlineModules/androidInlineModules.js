"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSymlinksToKotlinFiles = createSymlinksToKotlinFiles;
exports.getClassName = getClassName;
exports.generateInlineModulesListFile = generateInlineModulesListFile;
const console_1 = require("console");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const concurrency_1 = require("../concurrency");
async function createSymlinksToKotlinFiles(mirrorPath, inlineModulesMirror) {
    const kotlinFiles = inlineModulesMirror.files.filter(({ filePath }) => filePath.endsWith('.kt'));
    await (0, concurrency_1.taskAll)(kotlinFiles, async ({ filePath, watchedDir }) => {
        const filePathRelativeToWatchedDir = path_1.default.relative(watchedDir, filePath);
        const targetPath = path_1.default.resolve(mirrorPath, filePathRelativeToWatchedDir);
        try {
            await fs_1.default.promises.mkdir(path_1.default.dirname(targetPath), { recursive: true });
            await fs_1.default.promises.symlink(filePath, targetPath);
        }
        catch (e) {
            (0, console_1.error)(`Couldn't symlink inline module: ${filePath}. Error: ${e}`);
        }
    });
}
function getClassName(classNameWithPackage) {
    const index = classNameWithPackage.lastIndexOf('.');
    if (index < 0) {
        return classNameWithPackage;
    }
    return classNameWithPackage.substring(index + 1);
}
async function generateInlineModulesListFile(inlineModulesListPath, inlineModulesMirror) {
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
${inlineModulesMirror.kotlinClasses
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
    await fs_1.default.promises.mkdir(inlineModulesListPath, { recursive: true });
    await fs_1.default.promises.writeFile(path_1.default.resolve(inlineModulesListPath, 'ExpoInlineModulesList.java'), fileContent);
}
//# sourceMappingURL=androidInlineModules.js.map
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
    await fs_1.default.promises.mkdir(inlineModulesListPath, { recursive: true });
    await fs_1.default.promises.writeFile(path_1.default.resolve(inlineModulesListPath, 'ExpoInlineModulesList.kt'), fileContent);
}
//# sourceMappingURL=androidInlineModules.js.map
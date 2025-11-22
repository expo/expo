"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.assertValidAndroidAssetName = assertValidAndroidAssetName;
exports.isValidAndroidAssetName = isValidAndroidAssetName;
// this is an approximation of the android resource name rules
const validPattern = /^[a-z][a-z0-9_]*$/;
const blockList = ['abstract', 'continue', 'for', 'new', 'switch', 'assert', 'default', 'if', 'package', 'synchronized', 'boolean', 'do', 'goto', 'private', 'this', 'break', 'double', 'implements', 'protected', 'throw', 'byte', 'else', 'import', 'public', 'throws', 'case', 'enum', 'instanceof', 'return', 'transient', 'catch', 'extends', 'int', 'short', 'try', 'char', 'final', 'interface', 'static', 'void', 'class', 'finally', 'long', 'strictfp', 'volatile', 'const', 'float', 'native', 'super', 'while', '_'];
function isValidAndroidAssetName(assetNameWithoutExtension) {
  return validPattern.test(assetNameWithoutExtension) && !blockList.includes(assetNameWithoutExtension);
}
function assertValidAndroidAssetName(assetNameWithoutExtension, tag) {
  if (!isValidAndroidAssetName(assetNameWithoutExtension)) {
    const prefix = tag ? `[${tag}] ` : '';
    throw new Error(`${prefix}Resource name "${assetNameWithoutExtension}" is not valid. Android resource names must start with a letter and contain only ` + `lowercase a-z, 0-9, or underscore characters. Additionally, Java reserved words are not allowed.`);
  }
}
//# sourceMappingURL=validations.js.map
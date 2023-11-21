"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getBareExtensions = getBareExtensions;
exports.getExtensions = getExtensions;
exports.getLanguageExtensionsInOrder = getLanguageExtensionsInOrder;
function _assert() {
  const data = _interopRequireDefault(require("assert"));
  _assert = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function getExtensions(platforms, extensions, workflows) {
  // In the past we used spread operators to collect the values so now we enforce type safety on them.
  (0, _assert().default)(Array.isArray(platforms), 'Expected: `platforms: string[]`');
  (0, _assert().default)(Array.isArray(extensions), 'Expected: `extensions: string[]`');
  (0, _assert().default)(Array.isArray(workflows), 'Expected: `workflows: string[]`');
  const fileExtensions = [];
  // support .expo files
  for (const workflow of [...workflows, '']) {
    // Ensure order is correct: [platformA.js, platformB.js, js]
    for (const platform of [...platforms, '']) {
      // Support both TypeScript and JavaScript
      for (const extension of extensions) {
        fileExtensions.push([platform, workflow, extension].filter(Boolean).join('.'));
      }
    }
  }
  return fileExtensions;
}
function getLanguageExtensionsInOrder({
  isTS,
  isModern,
  isReact
}) {
  // @ts-ignore: filter removes false type
  const addLanguage = lang => [lang, isReact && `${lang}x`].filter(Boolean);

  // Support JavaScript
  let extensions = addLanguage('js');
  if (isModern) {
    extensions.unshift('mjs');
  }
  if (isTS) {
    extensions = [...addLanguage('ts'), ...extensions];
  }
  return extensions;
}
function getBareExtensions(platforms, languageOptions = {
  isTS: true,
  isModern: true,
  isReact: true
}) {
  const fileExtensions = getExtensions(platforms, getLanguageExtensionsInOrder(languageOptions), []);
  // Always add these last
  _addMiscellaneousExtensions(platforms, fileExtensions);
  return fileExtensions;
}
function _addMiscellaneousExtensions(platforms, fileExtensions) {
  // Always add these with no platform extension
  // In the future we may want to add platform and workspace extensions to json.
  fileExtensions.push('json');
  // Native doesn't currently support web assembly.
  if (platforms.includes('web')) {
    fileExtensions.push('wasm');
  }
  return fileExtensions;
}
//# sourceMappingURL=extensions.js.map
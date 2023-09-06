"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBareExtensions = exports.getLanguageExtensionsInOrder = exports.getExtensions = void 0;
const assert_1 = __importDefault(require("assert"));
function getExtensions(platforms, extensions, workflows) {
    // In the past we used spread operators to collect the values so now we enforce type safety on them.
    (0, assert_1.default)(Array.isArray(platforms), 'Expected: `platforms: string[]`');
    (0, assert_1.default)(Array.isArray(extensions), 'Expected: `extensions: string[]`');
    (0, assert_1.default)(Array.isArray(workflows), 'Expected: `workflows: string[]`');
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
exports.getExtensions = getExtensions;
function getLanguageExtensionsInOrder({ isTS, isModern, isReact, }) {
    // @ts-ignore: filter removes false type
    const addLanguage = (lang) => [lang, isReact && `${lang}x`].filter(Boolean);
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
exports.getLanguageExtensionsInOrder = getLanguageExtensionsInOrder;
function getBareExtensions(platforms, languageOptions = { isTS: true, isModern: true, isReact: true }) {
    const fileExtensions = getExtensions(platforms, getLanguageExtensionsInOrder(languageOptions), []);
    // Always add these last
    _addMiscellaneousExtensions(platforms, fileExtensions);
    return fileExtensions;
}
exports.getBareExtensions = getBareExtensions;
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

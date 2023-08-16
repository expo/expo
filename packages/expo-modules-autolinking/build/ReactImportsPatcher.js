"use strict";
// Copyright 2018-present 650 Industries. All rights reserved.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchFileAsync = exports.patchReactImportsAsync = void 0;
const fast_glob_1 = __importDefault(require("fast-glob"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
/**
 * Remove all double-quoted react header imports
 * @param dirs target directories to patch
 * @param options PatchReactImportsOptions
 */
async function patchReactImportsAsync(dirs, options) {
    const headerSet = await generateReactHeaderSetAsync(path_1.default.join(options.podsRoot, 'Headers', 'Public', 'React-Core', 'React'));
    await Promise.all(dirs.map((dir) => patchDirAsync(headerSet, dir, options.dryRun)));
}
exports.patchReactImportsAsync = patchReactImportsAsync;
/**
 * Generate `React-Core` public header names as a set, will transform necessary headers based on this set.
 */
async function generateReactHeaderSetAsync(reactHeaderDir) {
    const files = await (0, fast_glob_1.default)('*.h', { cwd: reactHeaderDir });
    return new Set(files);
}
/**
 * Patch imports from a file
 * @param headerSet prebuilt React-Core header set
 * @param file target patch file
 * @param dryRun true if not writing changes to file
 */
async function patchFileAsync(headerSet, file, dryRun) {
    let changed = false;
    const content = await fs_extra_1.default.readFile(file, 'utf-8');
    let transformContent = content.replace(/(?<=^\s*)#import\s+"(.+)"(?=\s*$)/gm, (match, headerName) => {
        // `#import "RCTBridge.h"` -> `#import <React/RCTBridge.h>`
        if (headerSet.has(headerName)) {
            changed = true;
            return `#import <React/${headerName}>`;
        }
        // `#import "React/RCTBridge.h"` -> `#import <React/RCTBridge.h>`
        if (headerName.startsWith('React/')) {
            const name = headerName.substring(6);
            if (headerSet.has(name)) {
                changed = true;
                return `#import <React/${name}>`;
            }
        }
        // Otherwise, return original import
        return match;
    });
    transformContent = transformContent.replace(/(?<=^\s*)#(if|elif)\s+__has_include\("(.+)"\)(?=\s*$)/gm, (match, ifPrefix, headerName) => {
        // `#if __has_include("RCTBridge.h")` -> `#if __has_include(<React/RCTBridge.h>)`
        if (headerSet.has(headerName)) {
            changed = true;
            return `#${ifPrefix} __has_include(<React/${headerName}>)`;
        }
        // `#if __has_include("React/RCTBridge.h")` -> `#if __has_include(<React/RCTBridge.h>)`
        if (headerName.startsWith('React/')) {
            const name = headerName.substring(6);
            if (headerSet.has(name)) {
                changed = true;
                return `#${ifPrefix} __has_include(<React/${name}>)`;
            }
        }
        // Otherwise, return original import
        return match;
    });
    if (changed) {
        console.log(`Patching imports for file: ${file}`);
        if (!dryRun) {
            await fs_extra_1.default.writeFile(file, transformContent);
        }
    }
}
exports.patchFileAsync = patchFileAsync;
/**
 * Patch imports from a directory
 * @param headerSet prebuilt React-Core header set
 * @param file target patch file
 * @param dryRun true if not writing changes to file
 */
async function patchDirAsync(headerSet, dir, dryRun) {
    const files = await (0, fast_glob_1.default)('**/*.{h,m,mm}', { cwd: dir, absolute: true });
    return Promise.all(files.map((file) => patchFileAsync(headerSet, file, dryRun)));
}
//# sourceMappingURL=ReactImportsPatcher.js.map
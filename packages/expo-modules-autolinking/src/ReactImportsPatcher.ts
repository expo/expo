// Copyright 2018-present 650 Industries. All rights reserved.

import glob from 'fast-glob';
import fs from 'fs-extra';
import path from 'path';

import { PatchReactImportsOptions } from './types';

/**
 * Remove all double-quoted react header imports
 * @param dirs target directories to patch
 * @param options PatchReactImportsOptions
 */
export async function patchReactImportsAsync(dirs: string[], options: PatchReactImportsOptions) {
  const headerSet = await generateReactHeaderSetAsync(
    path.join(options.podsRoot, 'Headers', 'Public', 'React-Core', 'React')
  );
  await Promise.all(dirs.map((dir) => patchDirAsync(headerSet, dir, options.dryRun)));
}

/**
 * Generate `React-Core` public header names as a set, will transform necessary headers based on this set.
 */
async function generateReactHeaderSetAsync(reactHeaderDir: string): Promise<Set<string>> {
  const files = await glob('*.h', { cwd: reactHeaderDir });
  return new Set(files);
}

/**
 * Patch imports from a file
 * @param headerSet prebuilt React-Core header set
 * @param file target patch file
 * @param dryRun true if not writing changes to file
 */
export async function patchFileAsync(headerSet: Set<string>, file: string, dryRun: boolean) {
  let changed = false;
  const content = await fs.readFile(file, 'utf-8');
  let transformContent = content.replace(
    /^#import\s+"(.+)"$/gm,
    (match: string, headerName: string): string => {
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
    }
  );

  transformContent = transformContent.replace(
    /^#(if|elif)\s+__has_include\("(.+)"\)$/gm,
    (match: string, ifPrefix: string, headerName: string): string => {
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
    }
  );

  if (changed) {
    console.log(`Patching imports for file: ${file}`);
    if (!dryRun) {
      await fs.writeFile(file, transformContent);
    }
  }
}

/**
 * Patch imports from a directory
 * @param headerSet prebuilt React-Core header set
 * @param file target patch file
 * @param dryRun true if not writing changes to file
 */
async function patchDirAsync(headerSet: Set<string>, dir: string, dryRun: boolean) {
  const files = await glob('**/*.{h,m,mm}', { cwd: dir, absolute: true });
  return Promise.all(files.map((file) => patchFileAsync(headerSet, file, dryRun)));
}

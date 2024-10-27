#!/usr/bin/env yarn --silent ts-node --transpile-only

import fs from 'fs/promises';
import path from 'path';

const PACKAGE_ROOT = path.resolve(__dirname, '..');

async function runAsync(): Promise<void> {
  const programName = path.basename(process.argv[1]);
  if (process.argv.length < 3) {
    console.log(`Usage: ${programName} <sqliteSrcDir>`);
    process.exit(1);
  }
  const args = process.argv.slice(2);
  const sqliteSrcDir = args[0];

  const apiSet = await queryApiSetAsync(path.join(sqliteSrcDir, 'sqlite3.h'));
  await Promise.all([
    replaceVendorSymbolsAsync(apiSet, sqliteSrcDir),
    replaceIosSymbolsAsync(apiSet),
    replaceAndroidSymbolsAsync(apiSet),
  ]);
}

(async () => {
  try {
    await runAsync();
  } catch (e) {
    console.error('Uncaught Error', e);
    process.exit(1);
  }
})();

async function queryApiSetAsync(headerFilePath: string): Promise<Set<string>> {
  const contents = await fs.readFile(headerFilePath, 'utf8');
  const apiSet = new Set<string>();

  const apiRegExp = /(SQLITE_API .+? \*?)(ex)?(sqlite3_.+?)\(/g;
  const matchesApi = contents.matchAll(apiRegExp);
  for (const match of matchesApi) {
    apiSet.add(match[3]);
  }

  const structRegExp = /\bstruct\s+?(ex)?(sqlite3_\w+)/g;
  const matchesStruct = contents.matchAll(structRegExp);
  for (const match of matchesStruct) {
    apiSet.add(match[2]);
  }

  return apiSet;
}

async function replaceVendorSymbolsAsync(apiSet: Set<string>, sqliteSrcDir: string): Promise<void> {
  const files = [path.join(sqliteSrcDir, 'sqlite3.c'), path.join(sqliteSrcDir, 'sqlite3.h')];
  await Promise.all(files.map((file) => replaceSqlite3SymbolsAsync(apiSet, file)));
}

async function replaceIosSymbolsAsync(apiSet: Set<string>): Promise<void> {
  const iosSrcRoot = path.join(PACKAGE_ROOT, 'ios');
  const files = [
    path.join(iosSrcRoot, 'CRSQLiteLoader.m'),
    path.join(iosSrcRoot, 'SQLiteModule.swift'),
  ];
  await Promise.all(files.map((file) => replaceSqlite3SymbolsAsync(apiSet, file)));
}

async function replaceAndroidSymbolsAsync(apiSet: Set<string>): Promise<void> {
  const androidSrcRoot = path.join(PACKAGE_ROOT, 'android/src/main/cpp');
  const files = [
    path.join(androidSrcRoot, 'SQLite3Wrapper.cpp'),
    path.join(androidSrcRoot, 'NativeDatabaseBinding.cpp'),
    path.join(androidSrcRoot, 'NativeStatementBinding.cpp'),
  ];
  await Promise.all(
    files.map((file) =>
      replaceSqlite3SymbolsAsync(apiSet, file, {
        regexLookBehindNegative: '(makeNativeMethod\\("|Binding::|SQLite3Wrapper::|this->)',
      })
    )
  );

  const headerApiSet = new Set(['sqlite3_stmt']);
  const headerFiles = [
    path.join(androidSrcRoot, 'SQLite3Wrapper.h'),
    path.join(androidSrcRoot, 'NativeDatabaseBinding.h'),
    path.join(androidSrcRoot, 'NativeStatementBinding.h'),
  ];
  await Promise.all(headerFiles.map((file) => replaceSqlite3SymbolsAsync(headerApiSet, file)));
}

async function replaceSqlite3SymbolsAsync(
  apiSet: Set<string>,
  filePath: string,
  options?: {
    regexLookBehindNegative?: string;
  }
): Promise<void> {
  let contents = await fs.readFile(filePath, 'utf8');
  let regexLookBehindNegative = '';
  if (options?.regexLookBehindNegative) {
    regexLookBehindNegative = `(?<!${options.regexLookBehindNegative})`;
  }
  for (const symbol of apiSet) {
    const replaceRegexpCall = new RegExp(`\\b${regexLookBehindNegative}${symbol}\\b`, 'g');
    contents = contents.replace(replaceRegexpCall, `ex${symbol}`);
  }
  await fs.writeFile(filePath, contents);
}

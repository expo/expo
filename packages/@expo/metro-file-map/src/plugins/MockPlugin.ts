/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from 'path';

import { RootPathUtils } from '../lib/RootPathUtils';
import normalizePathSeparatorsToPosix from '../lib/normalizePathSeparatorsToPosix';
import normalizePathSeparatorsToSystem from '../lib/normalizePathSeparatorsToSystem';
import type {
  Console,
  FileMapPlugin,
  FileMapPluginInitOptions,
  FileMapPluginWorker,
  MockMap as IMockMap,
  Path,
  RawMockMap,
  ReadonlyFileSystemChanges,
} from '../types';
import getMockName from './mocks/getMockName';

export const CACHE_VERSION = 2;

export interface MockMapOptions {
  readonly console: Console;
  readonly mocksPattern: RegExp;
  readonly rawMockMap?: RawMockMap;
  readonly rootDir: Path;
  readonly throwOnModuleCollision: boolean;
}

export default class MockPlugin implements FileMapPlugin<RawMockMap, undefined>, IMockMap {
  readonly name: 'mocks' = 'mocks';

  readonly #mocksPattern: RegExp;
  #raw: RawMockMap;
  readonly #rootDir: Path;
  readonly #pathUtils: RootPathUtils;
  readonly #console: typeof console;
  #throwOnModuleCollision: boolean;

  constructor({
    console,
    mocksPattern,
    rawMockMap = {
      duplicates: new Map(),
      mocks: new Map(),
      version: CACHE_VERSION,
    },
    rootDir,
    throwOnModuleCollision,
  }: MockMapOptions) {
    this.#mocksPattern = mocksPattern;
    if (rawMockMap.version !== CACHE_VERSION) {
      throw new Error('Incompatible state passed to MockPlugin');
    }
    this.#raw = rawMockMap;
    this.#rootDir = rootDir;
    this.#console = console;
    this.#pathUtils = new RootPathUtils(rootDir);
    this.#throwOnModuleCollision = throwOnModuleCollision;
  }

  async initialize({ files, pluginState }: FileMapPluginInitOptions<RawMockMap>): Promise<void> {
    if (pluginState != null && (pluginState as RawMockMap).version === this.#raw.version) {
      // Use cached state directly if available
      this.#raw = pluginState as RawMockMap;
    } else {
      // Otherwise, traverse all files to rebuild
      for (const { canonicalPath } of files.fileIterator({
        includeNodeModules: false,
        includeSymlinks: false,
      })) {
        this.#onFileAdded(canonicalPath);
      }
    }
  }

  getMockModule(name: string): Path | undefined | null {
    const mockPosixRelativePath = this.#raw.mocks.get(name) || this.#raw.mocks.get(name + '/index');
    if (typeof mockPosixRelativePath !== 'string') {
      return null;
    }
    return this.#pathUtils.normalToAbsolute(normalizePathSeparatorsToSystem(mockPosixRelativePath));
  }

  onChanged(delta: ReadonlyFileSystemChanges<undefined | null>): void {
    // Process removals first so that moves aren't treated as duplicates.
    for (const [canonicalPath] of delta.removedFiles) {
      this.#onFileRemoved(canonicalPath);
    }
    for (const [canonicalPath] of delta.addedFiles) {
      this.#onFileAdded(canonicalPath);
    }
  }

  #onFileAdded(canonicalPath: Path): void {
    const absoluteFilePath = this.#pathUtils.normalToAbsolute(canonicalPath);
    if (!this.#mocksPattern.test(absoluteFilePath)) {
      return;
    }

    const mockName = getMockName(absoluteFilePath);
    const posixRelativePath = normalizePathSeparatorsToPosix(canonicalPath);

    const existingMockPosixPath = this.#raw.mocks.get(mockName);
    if (existingMockPosixPath != null) {
      if (existingMockPosixPath !== posixRelativePath) {
        let duplicates = this.#raw.duplicates.get(mockName);
        if (duplicates == null) {
          duplicates = new Set([existingMockPosixPath, posixRelativePath]);
          this.#raw.duplicates.set(mockName, duplicates);
        } else {
          duplicates.add(posixRelativePath);
        }

        this.#console.warn(this.#getMessageForDuplicates(mockName, duplicates));
      }
    }

    // If there are duplicates and we don't throw, the latest mock wins.
    // This is to preserve backwards compatibility, but it's unpredictable.
    this.#raw.mocks.set(mockName, posixRelativePath);
  }

  #onFileRemoved(canonicalPath: Path): void {
    const absoluteFilePath = this.#pathUtils.normalToAbsolute(canonicalPath);
    if (!this.#mocksPattern.test(absoluteFilePath)) {
      return;
    }
    const mockName = getMockName(absoluteFilePath);
    const duplicates = this.#raw.duplicates.get(mockName);
    if (duplicates != null) {
      const posixRelativePath = normalizePathSeparatorsToPosix(canonicalPath);
      duplicates.delete(posixRelativePath);
      if (duplicates.size === 1) {
        this.#raw.duplicates.delete(mockName);
      }
      // Set the mock to a remaining duplicate. Should never be empty.
      // Size was checked as 1 above, so this is always defined
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const remaining = duplicates.values().next().value!;
      this.#raw.mocks.set(mockName, remaining);
    } else {
      this.#raw.mocks.delete(mockName);
    }
  }

  getSerializableSnapshot(): RawMockMap {
    return {
      duplicates: new Map([...this.#raw.duplicates].map(([k, v]) => [k, new Set(v)])),
      mocks: new Map(this.#raw.mocks),
      version: this.#raw.version,
    };
  }

  assertValid(): void {
    if (!this.#throwOnModuleCollision) {
      return;
    }
    // Throw an aggregate error for each duplicate.
    const errors: string[] = [];
    for (const [mockName, relativePosixPaths] of this.#raw.duplicates) {
      errors.push(this.#getMessageForDuplicates(mockName, relativePosixPaths));
    }
    if (errors.length > 0) {
      throw new Error(
        `Mock map has ${errors.length} error${errors.length > 1 ? 's' : ''}:\n${errors.join('\n')}`
      );
    }
  }

  #getMessageForDuplicates(mockName: string, relativePosixPaths: ReadonlySet<string>): string {
    return (
      'Duplicate manual mock found for `' +
      mockName +
      '`:\n' +
      [...relativePosixPaths]
        .map(
          (relativePosixPath) =>
            '    * <rootDir>' +
            path.sep +
            this.#pathUtils.absoluteToNormal(normalizePathSeparatorsToSystem(relativePosixPath)) +
            '\n'
        )
        .join('')
    );
  }

  getCacheKey(): string {
    return this.#mocksPattern.source.replaceAll('\\\\', '\\/') + ',' + this.#mocksPattern.flags;
  }

  getWorker(): FileMapPluginWorker | undefined | null {
    return null;
  }
}

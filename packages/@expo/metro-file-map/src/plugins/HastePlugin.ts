/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from 'path';

import H from '../constants';
import { RootPathUtils } from '../lib/RootPathUtils';
import { chainComparators, compareStrings } from '../lib/sorting';
import type {
  Console,
  DuplicatesIndex,
  DuplicatesSet,
  FileMapPlugin,
  FileMapPluginInitOptions,
  FileMapPluginWorker,
  HasteConflict,
  HasteMap,
  HasteMapItem,
  HasteMapItemMetadata,
  HTypeValue,
  Path,
  PerfLogger,
  ReadonlyFileSystemChanges,
} from '../types';
import { DuplicateHasteCandidatesError } from './haste/DuplicateHasteCandidatesError';
import { HasteConflictsError } from './haste/HasteConflictsError';
import getPlatformExtension from './haste/getPlatformExtension';

const EMPTY_OBJ: Readonly<{ [key: string]: HasteMapItemMetadata }> = {};
const EMPTY_MAP: ReadonlyMap<string, DuplicatesSet> = new Map();
const PACKAGE_JSON = /(?:[/\\]|^)package\.json$/;

// Periodically yield to the event loop to allow parallel I/O, etc.
// Based on 200k files taking up to 800ms => max 40ms between yields.
const YIELD_EVERY_NUM_HASTE_FILES = 10000;

export interface HasteMapOptions {
  readonly console?: Console | null;
  readonly enableHastePackages: boolean;
  readonly hasteImplModulePath: string | null;
  readonly perfLogger?: PerfLogger | null;
  readonly platforms: ReadonlySet<string>;
  readonly rootDir: Path;
  readonly failValidationOnConflicts: boolean;
}

export default class HastePlugin implements HasteMap, FileMapPlugin<null, string | null> {
  readonly name: 'haste' = 'haste';

  readonly #console: Console | undefined | null;
  readonly #duplicates: DuplicatesIndex = new Map();
  readonly #enableHastePackages: boolean;
  readonly #failValidationOnConflicts: boolean;
  #getModuleNameByPath: ((mixedPath: string) => string | null | undefined) | undefined;
  readonly #hasteImplModulePath: string | undefined | null;
  readonly #map: Map<string, HasteMapItem> = new Map();
  readonly #pathUtils: RootPathUtils;
  readonly #perfLogger: PerfLogger | undefined | null;
  readonly #platforms: ReadonlySet<string>;
  readonly #rootDir: Path;

  constructor(options: HasteMapOptions) {
    this.#console = options.console ?? globalThis.console;
    this.#enableHastePackages = options.enableHastePackages;
    this.#hasteImplModulePath = options.hasteImplModulePath;
    this.#perfLogger = options.perfLogger;
    this.#platforms = options.platforms;
    this.#rootDir = options.rootDir;
    this.#pathUtils = new RootPathUtils(options.rootDir);
    this.#failValidationOnConflicts = options.failValidationOnConflicts;
  }

  async initialize({ files }: FileMapPluginInitOptions<null, string | null>): Promise<void> {
    this.#perfLogger?.point('constructHasteMap_start');
    let hasteFiles = 0;
    for (const { baseName, canonicalPath, pluginData: hasteId } of files.fileIterator({
      // Symlinks and node_modules are never Haste modules or packages.
      includeNodeModules: false,
      includeSymlinks: false,
    })) {
      if (hasteId == null) {
        continue;
      }
      this.setModule(hasteId, [
        canonicalPath,
        this.#enableHastePackages && baseName === 'package.json' ? H.PACKAGE : H.MODULE,
      ]);
      if (++hasteFiles % YIELD_EVERY_NUM_HASTE_FILES === 0) {
        await new Promise(setImmediate);
      }
    }
    this.#getModuleNameByPath = (mixedPath) => {
      const result = files.lookup(mixedPath);
      return result.exists && result.type === 'f' && typeof result.pluginData === 'string'
        ? result.pluginData
        : null;
    };
    this.#perfLogger?.point('constructHasteMap_end');
    this.#perfLogger?.annotate({ int: { hasteFiles } });
  }

  getSerializableSnapshot(): null {
    // Haste is not serialised, but built from traversing the file metadata
    // on each run. This turns out to have comparable performance to
    // serialisation, at least when Haste is dense, and makes for a much
    // smaller cache.
    return null;
  }

  getModule(
    name: string,
    platform?: string | undefined | null,
    supportsNativePlatform?: boolean | undefined | null,
    type?: HTypeValue | undefined | null
  ): Path | undefined | null {
    const module = this.#getModuleMetadata(name, platform, !!supportsNativePlatform);
    if (module && module[H.TYPE] === (type ?? H.MODULE)) {
      const modulePath = module[H.PATH];
      return modulePath && this.#pathUtils.normalToAbsolute(modulePath);
    }
    return null;
  }

  getModuleNameByPath(mixedPath: Path): string | undefined | null {
    if (this.#getModuleNameByPath == null) {
      throw new Error('HastePlugin has not been initialized before getModuleNameByPath');
    }
    return this.#getModuleNameByPath(mixedPath) ?? null;
  }

  getPackage(
    name: string,
    platform: string | undefined | null,
    _supportsNativePlatform?: boolean | undefined | null
  ): Path | undefined | null {
    return this.getModule(name, platform, null, H.PACKAGE);
  }

  /**
   * When looking up a module's data, we walk through each eligible platform for
   * the query. For each platform, we want to check if there are known
   * duplicates for that name+platform pair. The duplication logic normally
   * removes elements from the `map` object, but we want to check upfront to be
   * extra sure. If metadata exists both in the `duplicates` object and the
   * `map`, this would be a bug.
   */
  #getModuleMetadata(
    name: string,
    platform: string | undefined | null,
    supportsNativePlatform: boolean
  ): HasteMapItemMetadata | null {
    const map = this.#map.get(name) || EMPTY_OBJ;
    const dupMap = this.#duplicates.get(name) || EMPTY_MAP;
    if (platform != null) {
      this.#assertNoDuplicates(name, platform, supportsNativePlatform, dupMap.get(platform));
      if (map[platform] != null) {
        return map[platform]!;
      }
    }
    if (supportsNativePlatform) {
      this.#assertNoDuplicates(
        name,
        H.NATIVE_PLATFORM,
        supportsNativePlatform,
        dupMap.get(H.NATIVE_PLATFORM)
      );
      if (map[H.NATIVE_PLATFORM]) {
        return map[H.NATIVE_PLATFORM]!;
      }
    }
    this.#assertNoDuplicates(
      name,
      H.GENERIC_PLATFORM,
      supportsNativePlatform,
      dupMap.get(H.GENERIC_PLATFORM)
    );
    if (map[H.GENERIC_PLATFORM]) {
      return map[H.GENERIC_PLATFORM]!;
    }
    return null;
  }

  #assertNoDuplicates(
    name: string,
    platform: string,
    supportsNativePlatform: boolean,
    relativePathSet: DuplicatesSet | undefined | null
  ): void {
    if (relativePathSet == null) {
      return;
    }
    const duplicates = new Map<string, number>();

    for (const [relativePath, type] of relativePathSet) {
      const duplicatePath = this.#pathUtils.normalToAbsolute(relativePath);
      duplicates.set(duplicatePath, type);
    }

    throw new DuplicateHasteCandidatesError(name, platform, supportsNativePlatform, duplicates);
  }

  onChanged(delta: ReadonlyFileSystemChanges<string | null | undefined>): void {
    // Process removals first so that moves aren't treated as duplicates.
    for (const [canonicalPath, maybeHasteId] of delta.removedFiles) {
      this.#onRemovedFile(canonicalPath, maybeHasteId);
    }
    for (const [canonicalPath, maybeHasteId] of delta.addedFiles) {
      this.#onNewFile(canonicalPath, maybeHasteId);
    }
  }

  #onNewFile(canonicalPath: string, id: string | null | undefined) {
    if (id == null) {
      // Not a Haste module or package
      return;
    }

    const module: HasteMapItemMetadata = [
      canonicalPath,
      this.#enableHastePackages && path.basename(canonicalPath) === 'package.json'
        ? H.PACKAGE
        : H.MODULE,
    ];

    this.setModule(id, module);
  }

  setModule(id: string, module: HasteMapItemMetadata) {
    let hasteMapItem = this.#map.get(id);
    if (!hasteMapItem) {
      hasteMapItem = Object.create(null) as HasteMapItem;
      this.#map.set(id, hasteMapItem);
    }
    const platform = getPlatformExtension(module[H.PATH], this.#platforms) || H.GENERIC_PLATFORM;

    const existingModule = hasteMapItem[platform];

    if (existingModule && existingModule[H.PATH] !== module[H.PATH]) {
      if (this.#console) {
        this.#console.warn(
          [
            'metro-file-map: Haste module naming collision: ' + id,
            '  The following files share their name; please adjust your hasteImpl:',
            '    * <rootDir>' + path.sep + existingModule[H.PATH],
            '    * <rootDir>' + path.sep + module[H.PATH],
            '',
          ].join('\n')
        );
      }

      // We do NOT want consumers to use a module that is ambiguous.
      delete hasteMapItem[platform];

      if (Object.keys(hasteMapItem).length === 0) {
        this.#map.delete(id);
      }

      let dupsByPlatform = this.#duplicates.get(id);
      if (dupsByPlatform == null) {
        dupsByPlatform = new Map();
        this.#duplicates.set(id, dupsByPlatform);
      }

      const dups = new Map([
        [module[H.PATH], module[H.TYPE]],
        [existingModule[H.PATH], existingModule[H.TYPE]],
      ]);
      dupsByPlatform.set(platform, dups);

      return;
    }

    const dupsByPlatform = this.#duplicates.get(id);
    if (dupsByPlatform != null) {
      const dups = dupsByPlatform.get(platform);
      if (dups != null) {
        dups.set(module[H.PATH], module[H.TYPE]);
      }
      return;
    }

    hasteMapItem[platform] = module;
  }

  #onRemovedFile(canonicalPath: string, moduleName: string | null | undefined) {
    if (moduleName == null) {
      // Not a Haste module or package
      return;
    }

    const platform = getPlatformExtension(canonicalPath, this.#platforms) || H.GENERIC_PLATFORM;

    const hasteMapItem = this.#map.get(moduleName);
    if (hasteMapItem != null) {
      delete hasteMapItem[platform];
      if (Object.keys(hasteMapItem).length === 0) {
        this.#map.delete(moduleName);
      } else {
        this.#map.set(moduleName, hasteMapItem);
      }
    }

    this.#recoverDuplicates(moduleName, canonicalPath);
  }

  assertValid(): void {
    if (!this.#failValidationOnConflicts) {
      return;
    }
    const conflicts = this.computeConflicts();
    if (conflicts.length > 0) {
      throw new HasteConflictsError(conflicts);
    }
  }

  /**
   * This function should be called when the file under `filePath` is removed
   * or changed. When that happens, we want to figure out if that file was
   * part of a group of files that had the same ID. If it was, we want to
   * remove it from the group. Furthermore, if there is only one file
   * remaining in the group, then we want to restore that single file as the
   * correct resolution for its ID, and cleanup the duplicates index.
   */
  #recoverDuplicates(moduleName: string, relativeFilePath: string) {
    let dupsByPlatform = this.#duplicates.get(moduleName);
    if (dupsByPlatform == null) {
      return;
    }

    const platform = getPlatformExtension(relativeFilePath, this.#platforms) || H.GENERIC_PLATFORM;
    let dups = dupsByPlatform.get(platform);
    if (dups == null) {
      return;
    }

    dupsByPlatform = new Map(dupsByPlatform);
    this.#duplicates.set(moduleName, dupsByPlatform);

    dups = new Map(dups);
    dupsByPlatform.set(platform, dups);
    dups.delete(relativeFilePath);

    if (dups.size !== 1) {
      return;
    }

    const uniqueModule = dups.entries().next().value;

    if (!uniqueModule) {
      return;
    }

    let dedupMap: HasteMapItem | undefined | null = this.#map.get(moduleName);

    if (dedupMap == null) {
      dedupMap = Object.create(null) as HasteMapItem;
      this.#map.set(moduleName, dedupMap);
    }
    dedupMap[platform] = uniqueModule;
    dupsByPlatform.delete(platform);
    if (dupsByPlatform.size === 0) {
      this.#duplicates.delete(moduleName);
    }
  }

  computeConflicts(): HasteConflict[] {
    const conflicts: HasteConflict[] = [];

    // Add literal duplicates tracked in the #duplicates map
    for (const [id, dupsByPlatform] of this.#duplicates.entries()) {
      for (const [platform, conflictingModules] of dupsByPlatform) {
        conflicts.push({
          absolutePaths: [...conflictingModules.keys()]
            .map((modulePath) => this.#pathUtils.normalToAbsolute(modulePath))
            // Sort for ease of testing
            .sort(),
          id,
          platform: platform === H.GENERIC_PLATFORM ? null : platform,
          type: 'duplicate',
        });
      }
    }

    // Add cases of "shadowing at a distance": a module with a platform suffix and
    // a module with a lower priority platform suffix (or no suffix), in different
    // directories.
    for (const [id, data] of this.#map) {
      const conflictPaths = new Set<string>();
      const basePaths: string[] = [];
      for (const basePlatform of [H.NATIVE_PLATFORM, H.GENERIC_PLATFORM]) {
        if (data[basePlatform] == null) {
          continue;
        }
        const basePath = data[basePlatform]![0];
        basePaths.push(basePath);
        const basePathDir = path.dirname(basePath);
        // Find all platforms that can shadow basePlatform
        // Given that X.(specific platform).js > x.native.js > X.js
        // and basePlatform is either 'native' or generic (no platform).
        for (const platform of Object.keys(data)) {
          if (platform === basePlatform || platform === H.GENERIC_PLATFORM /* lowest priority */) {
            continue;
          }
          const platformPath = data[platform]![0];
          if (path.dirname(platformPath) !== basePathDir) {
            conflictPaths.add(platformPath);
          }
        }
      }
      if (conflictPaths.size) {
        conflicts.push({
          absolutePaths: [...new Set([...conflictPaths, ...basePaths])]
            .map((modulePath) => this.#pathUtils.normalToAbsolute(modulePath))
            // Sort for ease of testing
            .sort(),
          id,
          platform: null,
          type: 'shadowing',
        });
      }
    }

    // Sort for ease of testing
    conflicts.sort(
      chainComparators(
        (a, b) => compareStrings(a.type, b.type),
        (a, b) => compareStrings(a.id, b.id),
        (a, b) => compareStrings(a.platform, b.platform)
      )
    );

    return conflicts;
  }

  getCacheKey(): string {
    return JSON.stringify([
      this.#enableHastePackages,
      this.#hasteImplModulePath != null ? require(this.#hasteImplModulePath).getCacheKey() : null,
      [...this.#platforms].sort(),
    ]);
  }

  getWorker(): FileMapPluginWorker {
    return {
      worker: {
        modulePath: require.resolve('./haste/worker.js'),
        setupArgs: {
          hasteImplModulePath: this.#hasteImplModulePath ?? null,
        },
      },
      filter: ({ isNodeModules, normalPath }) => {
        if (isNodeModules) {
          return false;
        }
        if (PACKAGE_JSON.test(normalPath)) {
          return this.#enableHastePackages;
        }
        return this.#hasteImplModulePath != null;
      },
    };
  }
}

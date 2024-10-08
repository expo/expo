/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import Bundler from '@bycedric/metro/metro/src/Bundler';
import DependencyGraph from '@bycedric/metro/metro/src/node-haste/DependencyGraph';
import { FileSystem } from '@bycedric/metro/metro-file-map';

type ExpoPatchedFileSystem = Omit<FileSystem, 'getSha1'> & {
  getSha1: FileSystem['getSha1'] & { __patched?: boolean };
  expoVirtualModules?: Map<string, Buffer>;
};

type ActualDependencyGraph = DependencyGraph & {
  _fileSystem: ExpoPatchedFileSystem;
};

type ActualBundler = Bundler & {
  _depGraph: ActualDependencyGraph;
};

type ExpoPatchedBundler = Bundler & {
  setVirtualModule: (id: string, contents: string) => void;
  hasVirtualModule: (id: string) => boolean;
};

function assertBundlerHasPrivateMembers(bundler: Bundler): asserts bundler is ActualBundler {
  if (!('_depGraph' in bundler)) {
    throw new Error(
      'Expected bundler to have member: _depGraph. Upstream metro may have removed this property.'
    );
  }

  assertDepGraphHasPrivateMembers(bundler._depGraph);
}

function assertDepGraphHasPrivateMembers(
  depGraph: unknown
): asserts depGraph is ActualDependencyGraph {
  if (!depGraph || typeof depGraph !== 'object' || !('_fileSystem' in depGraph)) {
    throw new Error(
      'Expected bundler._depGraph to have member: _fileSystem. Upstream metro may have removed this property.'
    );
  }
}

function ensureMetroBundlerPatchedWithSetVirtualModule(
  bundler: Bundler & {
    setVirtualModule?: (id: string, contents: string) => void;
    hasVirtualModule?: (id: string) => boolean;
  }
): ExpoPatchedBundler {
  if (!bundler.setVirtualModule) {
    bundler.setVirtualModule = function (this: Bundler, id: string, contents: string) {
      assertBundlerHasPrivateMembers(this);
      const fs = ensureFileSystemPatched(this._depGraph._fileSystem);
      fs.expoVirtualModules!.set(ensureStartsWithNullByte(id), Buffer.from(contents));
    };
    bundler.hasVirtualModule = function (this: Bundler, id: string) {
      assertBundlerHasPrivateMembers(this);
      const fs = ensureFileSystemPatched(this._depGraph._fileSystem);
      return fs.expoVirtualModules!.has(ensureStartsWithNullByte(id));
    };
  }

  return bundler as ExpoPatchedBundler;
}

function ensureStartsWithNullByte(id: string): string {
  // Because you'll likely need to return the path somewhere, we should just assert with a useful error message instead of
  // attempting to mutate the value behind the scenes. This ensures correctness in the resolution.
  if (!id.startsWith('\0')) {
    throw new Error(`Virtual modules in Expo CLI must start with with null byte (\\0), got: ${id}`);
  }
  return id;
}

export function getMetroBundlerWithVirtualModules(
  bundler: Bundler & {
    transformFile: Bundler['transformFile'] & { __patched?: boolean };
  }
): ExpoPatchedBundler {
  if (!bundler.transformFile.__patched) {
    const originalTransformFile = bundler.transformFile.bind(bundler);

    bundler.transformFile = async function (
      filePath: string,
      transformOptions: any,
      /** Optionally provide the file contents, this can be used to provide virtual contents for a file. */
      fileBuffer?: Buffer
    ) {
      // file buffer will be defined for virtual modules in Metro, e.g. context modules.
      if (!fileBuffer) {
        if (filePath.startsWith('\0')) {
          const graph = await this.getDependencyGraph();

          assertDepGraphHasPrivateMembers(graph);

          if (graph._fileSystem.expoVirtualModules) {
            fileBuffer = graph._fileSystem.expoVirtualModules.get(filePath);
          }

          if (!fileBuffer) {
            throw new Error(`Virtual module "${filePath}" not found.`);
          }
        }
      }
      return originalTransformFile(filePath, transformOptions, fileBuffer);
    };

    bundler.transformFile.__patched = true;
  }

  return ensureMetroBundlerPatchedWithSetVirtualModule(bundler);
}

function ensureFileSystemPatched(fs: ExpoPatchedFileSystem): ExpoPatchedFileSystem {
  if (!fs.getSha1.__patched) {
    const original_getSha1 = fs.getSha1.bind(fs);
    fs.getSha1 = (filename: string) => {
      // Rollup virtual module format.
      if (filename.startsWith('\0')) {
        return filename;
      }

      return original_getSha1(filename);
    };
    fs.getSha1.__patched = true;
  }

  // TODO: Connect virtual modules to a specific context so they don't cross-bundles.
  if (!fs.expoVirtualModules) {
    fs.expoVirtualModules = new Map<string, Buffer>();
  }

  return fs;
}

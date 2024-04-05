/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { FileSystem } from 'metro-file-map';
import Bundler from 'metro/src/Bundler';

export type ExpoPatchedFileSystem = FileSystem & {
  expoVirtualModules?: Map<string, Buffer>;
};

export type ExpoPatchedBundler = Bundler & {
  setVirtualModule: (id: string, contents: string) => void;
};

function ensureMetroBundlerPatchedWithSetVirtualModule(
  bundler: Bundler & {
    setVirtualModule?: (id: string, contents: string) => void;
  }
): ExpoPatchedBundler {
  if (!bundler.setVirtualModule) {
    bundler.setVirtualModule = function (this: Bundler, id: string, contents: string) {
      // @ts-expect-error: private property
      const fs = ensureFileSystemPatched(this._depGraph._fileSystem);
      fs.expoVirtualModules!.set(ensureStartsWithNullByte(id), Buffer.from(contents));
    };
  }

  return bundler as ExpoPatchedBundler;
}

function ensureStartsWithNullByte(id: string): string {
  return id.startsWith('\0') ? id : `\0${id}`;
}

export function getMetroBundlerWithVirtualModules(bundler: Bundler): Bundler & {
  setVirtualModule: (id: string, contents: string) => void;
} {
  // @ts-expect-error: private property
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

          // @ts-expect-error: private property
          if (graph._fileSystem.expoVirtualModules) {
            // @ts-expect-error: private property
            fileBuffer = graph._fileSystem.expoVirtualModules.get(filePath);
          }

          if (!fileBuffer) {
            throw new Error(`Virtual module "${filePath}" not found.`);
          }
        }
      }
      return originalTransformFile(filePath, transformOptions, fileBuffer);
    };

    // @ts-expect-error: private property
    bundler.transformFile.__patched = true;
  }

  return ensureMetroBundlerPatchedWithSetVirtualModule(bundler);
}

function ensureFileSystemPatched(fs: ExpoPatchedFileSystem): ExpoPatchedFileSystem {
  // @ts-expect-error: private property
  if (!fs.getSha1.__patched) {
    const original_getSha1 = fs.getSha1.bind(fs);
    fs.getSha1 = (filename: string) => {
      // Rollup virtual module format.
      if (filename.startsWith('\0')) {
        return filename;
      }

      return original_getSha1(filename);
    };
    // @ts-expect-error: private property
    fs.getSha1.__patched = true;
  }

  // TODO: Connect virtual modules to a specific context so they don't cross-bundles.
  if (!fs.expoVirtualModules) {
    fs.expoVirtualModules = new Map<string, Buffer>();
  }

  return fs;
}

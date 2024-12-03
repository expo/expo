import type { Module } from 'metro';
import { isJsModule } from 'metro/src/DeltaBundler/Serializers/helpers/js';
import path from 'path';

import { CSSMetadata } from './jsOutput';
import { SerialAsset } from './serializerAssets';
import { pathToHtmlSafeName } from '../transform-worker/css';
import { toPosixPath } from '../utils/filePath';
import { hashString } from '../utils/hash';

export type ReadOnlyDependencies<T = any> = ReadonlyMap<string, Module<T>>;

type Options = {
  processModuleFilter: (modules: Module) => boolean;
  assetPlugins: readonly string[];
  platform?: string | null;
  projectRoot: string;
  publicPath: string;
};

// s = static
const STATIC_EXPORT_DIRECTORY = '_expo/static/css';

export type JSModule = Module<{
  data: {
    code: string;
    map: unknown;
    lineCount: number;
    css?: {
      code: string;
      map: unknown;
      lineCount: number;
      skipCache?: boolean;
    };
  };
  type: 'js/module';
}> & {
  unstable_transformResultKey?: string;
};

function isTypeJSModule(module: Module<any>): module is JSModule {
  return isJsModule(module);
}

export function getCssSerialAssets<T extends any>(
  dependencies: ReadOnlyDependencies<T>,
  { projectRoot, entryFile }: Pick<Options, 'projectRoot'> & { entryFile: string }
): SerialAsset[] {
  const assets: SerialAsset[] = [];

  const visited = new Set<string>();

  function pushCssModule(module: JSModule) {
    const cssMetadata = getCssMetadata(module);
    if (cssMetadata) {
      const contents = cssMetadata.code;

      // NOTE(cedric): these relative paths are used as URL pathnames when serializing HTML
      // Use POSIX-format to avoid urls like `_expo/static/css/some\\file\\name.css`
      const originFilename = toPosixPath(path.relative(projectRoot, module.path));
      const filename = toPosixPath(
        path.join(
          // Consistent location
          STATIC_EXPORT_DIRECTORY,
          // Hashed file contents + name for caching
          fileNameFromContents({
            // Stable filename for hashing in CI.
            filepath: originFilename,
            src: contents,
          }) + '.css'
        )
      );

      if (cssMetadata.externalImports) {
        for (const external of cssMetadata.externalImports) {
          let source = `<link rel="stylesheet" href="${external.url}"`;

          // TODO: How can we do this for local css imports?
          if (external.media) {
            source += `media="${external.media}"`;
          }

          // TODO: supports attribute

          source += '>';

          assets.push({
            type: 'css-external',
            originFilename,
            filename: external.url,
            // Link CSS file
            source,
            metadata: {
              hmrId: pathToHtmlSafeName(originFilename),
            },
          });
        }
      }

      assets.push({
        type: 'css',
        originFilename,
        filename,
        source: contents,
        metadata: {
          hmrId: pathToHtmlSafeName(originFilename),
        },
      });
    }
  }

  function checkDep(absolutePath: string) {
    if (visited.has(absolutePath)) {
      return;
    }
    visited.add(absolutePath);
    const next = dependencies.get(absolutePath);
    if (!next) {
      return;
    }

    next.dependencies.forEach((dep) => {
      // Traverse the deps next to ensure the CSS is pushed in the correct order.
      checkDep(dep.absolutePath);
    });

    // Then push the JS after the siblings.
    if (getCssMetadata(next) && isTypeJSModule(next)) {
      pushCssModule(next);
    }
  }

  checkDep(entryFile);

  return assets;
}

function getCssMetadata(module: Module<any>): CSSMetadata | null {
  const data = module.output[0]?.data;
  if (data && typeof data === 'object' && 'css' in data) {
    if (typeof data.css !== 'object' || !('code' in (data as any).css)) {
      throw new Error(
        `Unexpected CSS metadata in Metro module (${module.path}): ${JSON.stringify(data.css)}`
      );
    }
    return data.css as CSSMetadata;
  }
  return null;
}

export function fileNameFromContents({ filepath, src }: { filepath: string; src: string }): string {
  // Decode if the path is encoded from the Metro dev server, then normalize paths for Windows support.
  const decoded = decodeURIComponent(filepath).replace(/\\/g, '/');
  return getFileName(decoded) + '-' + hashString(src);
}

export function getFileName(module: string) {
  return path.basename(module).replace(/\.[^.]+$/, '');
}

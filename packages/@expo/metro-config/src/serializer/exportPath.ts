/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import path from 'path';

import { fileNameFromContents } from './getCssDeps';

export function getExportFilename(
  contentFilename: string,
  {
    entryFilename,
    outputDirectory,
    outputExtension = '.js',
  }: { entryFilename?: string; outputDirectory?: string; outputExtension?: string }
): string {
  if (entryFilename != null) return entryFilename;
  const filename = contentFilename.replace(/\.js$/, outputExtension);
  return outputDirectory != null
    ? path.posix.join(outputDirectory, path.posix.basename(filename))
    : filename;
}

export function getChunkUrl(baseUrl: string, filename: string): string {
  return baseUrl.replace(/\/+$/, '') + '/' + filename.replace(/^\/+/, '');
}

export function getSiblingSourceMapUrl(filename: string): string {
  return encodeURIComponent(path.posix.basename(filename) + '.map');
}

export function getExportPathForDependencyWithOptions(
  dependencyPath: string,
  { platform, src, serverRoot }: { platform: string; serverRoot: string; src: string }
): string {
  const bundlePath = path.relative(serverRoot, dependencyPath);
  const relativePathname = path.join(
    path.dirname(bundlePath),
    // Strip the file extension
    path.basename(bundlePath, path.extname(bundlePath))
  );
  const name = fileNameFromContents({
    filepath: relativePathname,
    src,
  });
  return `_expo/static/js/${platform}/${name}.js`;
}

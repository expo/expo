/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import path from 'path';

import { fileNameFromContents } from './getCssDeps';

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

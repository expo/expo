/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from 'path';

const MOCKS_PATTERN = path.sep + '__mocks__' + path.sep;

export default (filePath: string): string => {
  const mockPath = filePath.split(MOCKS_PATTERN)[1]!;
  return mockPath.substring(0, mockPath.lastIndexOf(path.extname(mockPath))).replaceAll('\\', '/');
};

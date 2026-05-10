/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { BuildParameters } from '../types';
export default function rootRelativeCacheKeys(buildParameters: BuildParameters): {
    rootDirHash: string;
    relativeConfigHash: string;
};

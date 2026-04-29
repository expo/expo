/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { DuplicatesSet } from '../../types';
export declare class DuplicateHasteCandidatesError extends Error {
    hasteName: string;
    platform: string | null;
    supportsNativePlatform: boolean;
    duplicatesSet: DuplicatesSet;
    constructor(name: string, platform: string, supportsNativePlatform: boolean, duplicatesSet: DuplicatesSet);
}

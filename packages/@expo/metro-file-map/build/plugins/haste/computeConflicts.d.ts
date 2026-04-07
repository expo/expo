/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { HasteMapItem } from '../../types';
interface Conflict {
    id: string;
    platform: string | null;
    absolutePaths: string[];
    type: 'duplicate' | 'shadowing';
}
export declare function computeHasteConflicts(options: {
    readonly duplicates: ReadonlyMap<string, ReadonlyMap<string, ReadonlyMap<string, number>>>;
    readonly map: ReadonlyMap<string, HasteMapItem>;
    readonly rootDir: string;
}): Conflict[];
export {};

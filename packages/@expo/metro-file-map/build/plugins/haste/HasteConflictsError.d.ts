/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { HasteConflict } from '../../types';
export declare class HasteConflictsError extends Error {
    #private;
    constructor(conflicts: readonly HasteConflict[]);
    getDetailedMessage(pathsRelativeToRoot: string | null): string;
}

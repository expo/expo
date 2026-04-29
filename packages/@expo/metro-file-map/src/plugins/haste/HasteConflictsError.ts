/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from 'path';

import type { HasteConflict } from '../../types';

export class HasteConflictsError extends Error {
  #conflicts: readonly HasteConflict[];

  constructor(conflicts: readonly HasteConflict[]) {
    super(
      `Found ${conflicts.length} Haste conflict(s). Haste module IDs must be globally unique in the codebase.`
    );
    this.#conflicts = conflicts;
  }

  getDetailedMessage(pathsRelativeToRoot: string | null): string {
    const messages: string[] = [];
    const conflicts = this.#conflicts;
    if (conflicts.some((conflict) => conflict.type === 'duplicate')) {
      messages.push(
        'Advice: Resolve conflicts of type "duplicate" by renaming one or both of the conflicting modules, or by excluding conflicting paths from Haste.'
      );
    }
    if (conflicts.some((conflict) => conflict.type === 'shadowing')) {
      messages.push(
        'Advice: Resolve conflicts of type "shadowing" by moving the modules to the same folder, or by excluding conflicting paths from Haste.'
      );
    }
    let index = 0;
    for (const conflict of conflicts) {
      const itemHeader = index + 1 + '. ';
      const indent = ' '.repeat(itemHeader.length + 2);
      messages.push(
        '\n' +
          itemHeader +
          conflict.id +
          (conflict.platform != null ? `.${conflict.platform}` : '') +
          ` (${conflict.type})`
      );
      for (const modulePath of conflict.absolutePaths) {
        messages.push(
          indent +
            (pathsRelativeToRoot != null
              ? path.relative(pathsRelativeToRoot, modulePath)
              : modulePath)
        );
      }
      ++index;
    }
    return messages.join('\n');
  }
}

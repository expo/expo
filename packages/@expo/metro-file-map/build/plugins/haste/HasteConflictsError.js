"use strict";
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HasteConflictsError = void 0;
const path_1 = __importDefault(require("path"));
class HasteConflictsError extends Error {
    #conflicts;
    constructor(conflicts) {
        super(`Found ${conflicts.length} Haste conflict(s). Haste module IDs must be globally unique in the codebase.`);
        this.#conflicts = conflicts;
    }
    getDetailedMessage(pathsRelativeToRoot) {
        const messages = [];
        const conflicts = this.#conflicts;
        if (conflicts.some((conflict) => conflict.type === 'duplicate')) {
            messages.push('Advice: Resolve conflicts of type "duplicate" by renaming one or both of the conflicting modules, or by excluding conflicting paths from Haste.');
        }
        if (conflicts.some((conflict) => conflict.type === 'shadowing')) {
            messages.push('Advice: Resolve conflicts of type "shadowing" by moving the modules to the same folder, or by excluding conflicting paths from Haste.');
        }
        let index = 0;
        for (const conflict of conflicts) {
            const itemHeader = index + 1 + '. ';
            const indent = ' '.repeat(itemHeader.length + 2);
            messages.push('\n' +
                itemHeader +
                conflict.id +
                (conflict.platform != null ? `.${conflict.platform}` : '') +
                ` (${conflict.type})`);
            for (const modulePath of conflict.absolutePaths) {
                messages.push(indent +
                    (pathsRelativeToRoot != null
                        ? path_1.default.relative(pathsRelativeToRoot, modulePath)
                        : modulePath));
            }
            ++index;
        }
        return messages.join('\n');
    }
}
exports.HasteConflictsError = HasteConflictsError;

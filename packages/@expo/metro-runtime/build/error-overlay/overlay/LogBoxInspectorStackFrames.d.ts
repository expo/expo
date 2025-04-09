/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import type { StackType } from '../Data/LogBoxLog';
import { type MetroStackFrame } from '../devServerEndpoints';
export declare function getCollapseMessage(stackFrames: MetroStackFrame[], collapsed: boolean): string;
export declare function LogBoxInspectorStackFrames({ onRetry, type, }: {
    type: StackType;
    onRetry: () => void;
}): React.JSX.Element | null;
//# sourceMappingURL=LogBoxInspectorStackFrames.d.ts.map
/**
 * Copyright (c) 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import type { StackType } from '../Data/LogBoxLog';
import { type MetroStackFrame } from '../devServerEndpoints';
export declare function StackTraceList({ onRetry, type, stack, symbolicationStatus, projectRoot, }: {
    type: StackType;
    projectRoot?: string;
    onRetry: () => void;
    stack: MetroStackFrame[] | null;
    symbolicationStatus: 'COMPLETE' | 'FAILED' | 'NONE' | 'PENDING';
}): React.JSX.Element | null;
//# sourceMappingURL=StackTraceList.d.ts.map
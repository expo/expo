/**
 * Copyright (c) 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import type { StackType } from '../Data/LogBoxLog';
import type { Stack } from '../Data/LogBoxSymbolication';
import './StackTraceList.css';
export declare function StackTraceList({ onRetry, type, stack, symbolicationStatus, }: {
    type: StackType;
    onRetry: () => void;
    stack: Stack | null;
    symbolicationStatus: 'COMPLETE' | 'FAILED' | 'NONE' | 'PENDING';
}): React.JSX.Element | null;
//# sourceMappingURL=StackTraceList.d.ts.map
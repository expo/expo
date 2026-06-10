/**
 * Copyright (c) 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import type { StackType, MetroStackFrame } from '../Data/Types';
export declare function StackTraceList({ onRetry, type, stack, symbolicationStatus, }: {
    type: StackType;
    onRetry: () => void;
    stack: MetroStackFrame[] | null;
    symbolicationStatus: 'COMPLETE' | 'FAILED' | 'NONE' | 'PENDING';
}): React.JSX.Element | null;

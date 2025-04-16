/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import { LogBoxLog, type LogLevel } from './Data/LogBoxLog';
import type { Message } from './Data/parseLogBoxLog';
export declare function LogBoxInspectorContainer(): React.JSX.Element | null;
export declare function LogBoxInspector({ log, selectedLogIndex, logs, }: {
    log: LogBoxLog;
    selectedLogIndex: number;
    logs: LogBoxLog[];
}): React.JSX.Element;
export declare function ErrorMessageHeader(props: {
    collapsed: boolean;
    message: Message;
    level: LogLevel;
    title: string;
    onPress: () => void;
}): React.JSX.Element;
export declare function presentGlobalErrorOverlay(): void;
export declare function dismissGlobalErrorOverlay(): void;
//# sourceMappingURL=ErrorOverlay.d.ts.map
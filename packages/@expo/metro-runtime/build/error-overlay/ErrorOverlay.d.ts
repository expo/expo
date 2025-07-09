/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import { LogBoxLog, StackType } from './Data/LogBoxLog';
export declare function LogBoxInspectorContainer(): React.JSX.Element | null;
export declare function LogBoxInspector({ log, selectedLogIndex, logs, }: {
    log: LogBoxLog;
    selectedLogIndex: number;
    logs: LogBoxLog[];
}): React.JSX.Element;
export declare function ErrorOverlayBody({ onRetry }: {
    onRetry: (type: StackType) => void;
}): React.JSX.Element;
export declare function ErrorOverlayBodyContents({ log, onRetry, }: {
    log: LogBoxLog;
    onRetry: (type: StackType) => void;
}): React.JSX.Element;
declare const _default: React.Component<object, {}, any>;
export default _default;
//# sourceMappingURL=ErrorOverlay.d.ts.map
/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import { LogBoxLog } from '../Data/LogBoxLog';
import '../ErrorOverlay.css';
export declare function ErrorToastContainer(): React.JSX.Element | null;
export declare function ErrorToast(props: {
    log: LogBoxLog;
    totalLogCount: number;
    level: 'warn' | 'error';
    onPressOpen: () => void;
    onPressDismiss: () => void;
}): React.JSX.Element;
declare const _default: React.Component<object, {}, any>;
export default _default;
//# sourceMappingURL=ErrorToastContainer.web.d.ts.map
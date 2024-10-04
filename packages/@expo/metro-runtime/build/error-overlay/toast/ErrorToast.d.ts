/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import { LogBoxLog } from '../Data/LogBoxLog';
type Props = {
    log: LogBoxLog;
    totalLogCount: number;
    level: 'warn' | 'error';
    onPressOpen: () => void;
    onPressDismiss: () => void;
};
export declare function ErrorToast(props: Props): React.JSX.Element;
export {};
//# sourceMappingURL=ErrorToast.d.ts.map
/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import type { LogLevel } from '../Data/LogBoxLog';
import type { Message } from '../Data/parseLogBoxLog';
type Props = {
    collapsed: boolean;
    message: Message;
    level: LogLevel;
    title: string;
    onPress: () => void;
};
export declare function LogBoxInspectorMessageHeader(props: Props): React.JSX.Element;
export {};
//# sourceMappingURL=LogBoxInspectorMessageHeader.d.ts.map
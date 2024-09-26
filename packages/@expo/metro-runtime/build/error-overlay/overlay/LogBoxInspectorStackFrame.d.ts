/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import type { GestureResponderEvent } from 'react-native';
import { StackFrame } from 'stacktrace-parser';
type Props = {
    frame: StackFrame & {
        collapse?: boolean;
    };
    onPress?: (event: GestureResponderEvent) => void;
};
export declare function LogBoxInspectorStackFrame(props: Props): React.JSX.Element;
export {};
//# sourceMappingURL=LogBoxInspectorStackFrame.d.ts.map
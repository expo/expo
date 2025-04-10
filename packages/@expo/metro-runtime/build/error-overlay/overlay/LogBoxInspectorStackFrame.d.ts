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
export declare function LogBoxInspectorStackFrame(props: {
    projectRoot?: string;
    frame: StackFrame & {
        collapse?: boolean;
    };
    onPress?: (event: GestureResponderEvent) => void;
}): React.JSX.Element;
//# sourceMappingURL=LogBoxInspectorStackFrame.d.ts.map
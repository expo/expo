/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import type { GestureResponderEvent } from 'react-native';
type Props = {
    onPress?: ((event: GestureResponderEvent) => void) | null;
    status: 'COMPLETE' | 'FAILED' | 'NONE' | 'PENDING';
};
export declare function LogBoxInspectorSourceMapStatus(props: Props): React.JSX.Element | null;
export {};
//# sourceMappingURL=LogBoxInspectorSourceMapStatus.d.ts.map
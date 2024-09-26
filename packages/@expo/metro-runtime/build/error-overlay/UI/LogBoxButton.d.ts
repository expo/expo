/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import { GestureResponderEvent, Insets, ViewStyle } from 'react-native';
type Props = {
    backgroundColor: {
        default: string;
        pressed: string;
    };
    children?: any;
    hitSlop?: Insets;
    onPress?: ((event: GestureResponderEvent) => void) | null;
    style?: ViewStyle;
};
export declare function LogBoxButton(props: Props): React.JSX.Element;
export {};
//# sourceMappingURL=LogBoxButton.d.ts.map
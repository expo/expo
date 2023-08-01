/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import * as LogBoxStyle from './LogBoxStyle';
export function LogBoxButton(props) {
    const [pressed, setPressed] = useState(false);
    let backgroundColor = props.backgroundColor;
    if (!backgroundColor) {
        backgroundColor = {
            default: LogBoxStyle.getBackgroundColor(0.95),
            pressed: LogBoxStyle.getBackgroundColor(0.6),
        };
    }
    const content = (React.createElement(View, { style: [
            {
                backgroundColor: pressed ? backgroundColor.pressed : backgroundColor.default,
                ...Platform.select({
                    web: {
                        cursor: 'pointer',
                    },
                }),
            },
            props.style,
        ] }, props.children));
    return props.onPress == null ? (content) : (React.createElement(Pressable, { hitSlop: props.hitSlop, onPress: props.onPress, onPressIn: () => setPressed(true), onPressOut: () => setPressed(false) }, content));
}
//# sourceMappingURL=LogBoxButton.js.map
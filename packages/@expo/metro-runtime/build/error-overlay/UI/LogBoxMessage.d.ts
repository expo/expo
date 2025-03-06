/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import { StyleProp, TextStyle } from 'react-native';
import type { Message } from '../Data/parseLogBoxLog';
type Props = {
    message: Message;
    style: StyleProp<TextStyle>;
    plaintext?: boolean;
    maxLength?: number;
};
export declare function LogBoxMessage(props: Props): React.ReactElement;
export {};
//# sourceMappingURL=LogBoxMessage.d.ts.map
/**
 * Copyright © 2024 650 Industries.
 * Copyright (c) Nicolas Gallagher.
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * see: https://github.com/necolas/react-native-web
 */
import React from 'react';
import type { CheckboxEvent } from './Checkbox.types';
declare const ExpoCheckbox: React.ForwardRefExoticComponent<import("react-native").ViewProps & {
    value?: boolean;
    disabled?: boolean;
    color?: import("react-native").ColorValue;
    onChange?: (event: import("react-native").NativeSyntheticEvent<CheckboxEvent> | React.SyntheticEvent<HTMLInputElement, CheckboxEvent>) => void;
    onValueChange?: (value: boolean) => void;
} & React.RefAttributes<unknown>>;
export default ExpoCheckbox;
export declare const name = "ExpoCheckbox";
//# sourceMappingURL=ExpoCheckbox.web.d.ts.map
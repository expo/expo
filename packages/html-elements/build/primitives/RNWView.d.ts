/**
 * Copyright (c) Expo.
 * Copyright (c) Nicolas Gallagher.
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import * as React from 'react';
import { PlatformMethods, ViewProps } from 'react-native-web/dist/types';
/**
 * This is the View from react-native-web copied out in order to supply a custom `__element` property.
 * In the past, you could use `createElement` to create an element with a custom HTML element, but this changed
 * somewhere between 0.14...0.17.
 */
declare const View: React.AbstractComponent<ViewProps, HTMLElement & PlatformMethods>;
export default View;
//# sourceMappingURL=RNWView.d.ts.map
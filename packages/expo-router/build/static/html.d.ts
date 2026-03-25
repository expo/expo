/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { PropsWithChildren } from 'react';
import { ServerDataLoaderData } from '../loaders/ServerDataLoaderContext';
/**
 * Root style-reset for full-screen React Native web apps with a root `<ScrollView />` should use the following styles to ensure native parity. [Learn more](https://necolas.github.io/react-native-web/docs/setup/#root-element).
 */
export declare function ScrollViewStyleReset(): React.JSX.Element;
export declare function InnerRoot({ children, loadedData, }: PropsWithChildren<{
    loadedData: ServerDataLoaderData;
}>): React.JSX.Element;
//# sourceMappingURL=html.d.ts.map
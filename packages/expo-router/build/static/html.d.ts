/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { type PropsWithChildren } from 'react';
declare global {
    interface Window {
        /**
         * Data injected by the Expo Router loader for the current route.
         */
        __EXPO_ROUTER_LOADER_DATA__?: Record<string, any>;
    }
}
/**
 * Root style-reset for full-screen React Native web apps with a root `<ScrollView />` should use the following styles to ensure native parity. [Learn more](https://necolas.github.io/react-native-web/docs/setup/#root-element).
 */
export declare function ScrollViewStyleReset(): React.JSX.Element;
/**
 * Injects loader data into the HTML as a script tag for client-side hydration.
 * The data is serialized as JSON and made available on window.__EXPO_ROUTER_LOADER_DATA__.
 */
export declare function LoaderDataScript({ data }: {
    data: Record<string, unknown>;
}): React.JSX.Element;
export declare function Html({ children }: PropsWithChildren): React.JSX.Element;
//# sourceMappingURL=html.d.ts.map
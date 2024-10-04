import '../Expo.fx';
import { type ComponentType } from 'react';
type InitialProps = {
    exp?: {
        notification?: any;
        manifestString?: string;
        [key: string]: any;
    };
    shell?: boolean;
    shellManifestUrl?: string;
    [key: string]: any;
};
/**
 * Sets the initial React component to render natively in the app's root React Native view on Android, iOS, tvOS and the web.
 *
 * This method does the following:
 * - Invokes React Native's `AppRegistry.registerComponent`.
 * - Invokes React Native web's `AppRegistry.runApplication` on web to render to the root `index.html` file.
 * - Polyfills the `process.nextTick` function globally.
 * - Adds support for using the `fontFamily` React Native style with the `expo-font` package.
 *
 * This method also adds the following dev-only features that are removed in production bundles.
 * - Adds the Fast Refresh and bundle splitting indicator to the app.
 * - Asserts if the `expo-updates` package is misconfigured.
 * - Asserts if `react-native` is not aliased to `react-native-web` when running in the browser.
 * @param component The React component class that renders the rest of your app.
 */
export default function registerRootComponent<P extends InitialProps>(component: ComponentType<P>): void;
export {};
//# sourceMappingURL=registerRootComponent.d.ts.map
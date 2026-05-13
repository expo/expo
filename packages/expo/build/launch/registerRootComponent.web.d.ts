import '../Expo.fx';
import type { ComponentType } from 'react';
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
 * Sets the initial React component to render in the app's root view on the web.
 *
 * This is the web fork of `registerRootComponent`. It uses a local AppRegistry
 * backed by `react-dom/client` instead of depending on `react-native-web`.
 */
export default function registerRootComponent<P extends InitialProps>(component: ComponentType<P>): void;
export {};
//# sourceMappingURL=registerRootComponent.web.d.ts.map
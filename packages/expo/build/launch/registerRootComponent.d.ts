import '../Expo.fx';
import * as React from 'react';
type InitialProps = {
    exp: {
        notification?: any;
        manifestString?: string;
        [key: string]: any;
    };
    shell?: boolean;
    shellManifestUrl?: string;
    [key: string]: any;
};
export default function registerRootComponent<P extends InitialProps>(component: React.ComponentType<P>): void;
export {};
//# sourceMappingURL=registerRootComponent.d.ts.map
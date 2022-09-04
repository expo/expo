import * as React from 'react';
export declare type InitialProps = {
    exp: {
        notification?: any;
        errorRecovery?: any;
        manifestString?: string;
        [key: string]: any;
    };
    shell?: boolean;
    shellManifestUrl?: string;
    [key: string]: any;
};
export default function withRestoration<P extends InitialProps>(AppRootComponent: React.ComponentType<P>): React.ComponentType<P>;
//# sourceMappingURL=withRestoration.d.ts.map
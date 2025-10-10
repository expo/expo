import React, { ReactNode } from 'react';
interface DevServerContextType {
    projectRoot: string | undefined;
    serverRoot: string | undefined;
    sdkVersion: string | undefined;
}
export declare const DevServerProvider: React.FC<{
    children: ReactNode;
}>;
export declare const useDevServer: () => DevServerContextType;
export {};

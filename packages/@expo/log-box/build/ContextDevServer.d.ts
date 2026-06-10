import type { ReactNode } from 'react';
import React from 'react';
interface DevServerContextType {
    projectRoot: string | undefined;
    serverRoot: string | undefined;
    sdkVersion: string | undefined;
}
export declare const DevServerContext: React.FC<{
    children: ReactNode;
}>;
export declare const useDevServer: () => DevServerContextType;
export {};

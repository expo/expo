import React, { ReactNode } from 'react';
interface RuntimePlatformContextType {
    platform?: string;
    isNative: boolean;
}
export declare const RuntimePlatformProvider: React.FC<{
    children: ReactNode;
    platform?: string;
}>;
export declare const withRuntimePlatform: (Component: React.FC, options: {
    platform: string;
}) => (props: any) => React.JSX.Element;
export declare const useRuntimePlatform: () => RuntimePlatformContextType;
export {};

import type { ComponentType, ReactNode } from 'react';
export type HostBoundaryKind = 'react-native' | 'native-ui';
export type HostBoundaryOwner = 'root' | 'Host' | 'RNHostView';
export type HostBoundaryFrame = {
    id: string;
    kind: HostBoundaryKind;
    owner: HostBoundaryOwner;
};
export type HostBoundaryState = {
    frames: HostBoundaryFrame[];
};
export type HostBoundaryProviderProps = {
    children?: ReactNode;
    id?: string;
    kind: HostBoundaryKind;
    owner: HostBoundaryOwner;
};
export declare const rootHostBoundaryState: HostBoundaryState;
export declare const HostBoundaryContext: import("react").Context<HostBoundaryState>;
export declare function getHostBoundaryFrame(state: HostBoundaryState): HostBoundaryFrame | undefined;
export declare function useHostBoundaryState(): HostBoundaryState;
export declare function useHostBoundaryFrame(): HostBoundaryFrame | undefined;
export declare function useIsInsideNativeHost(): boolean;
export declare function HostBoundaryProvider({ children, id, kind, owner }: HostBoundaryProviderProps): import("react/jsx-runtime").JSX.Element;
export declare function withNativeHostBoundary<P extends object>(NativeHost: ComponentType<P>): (props: P) => import("react/jsx-runtime").JSX.Element;
export declare function withReactNativeHostBoundary<P extends object>(RNHost: ComponentType<P>): (props: P) => import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=hostContext.d.ts.map
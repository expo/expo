import { type ViewProps } from 'react-native';
export interface HostProps extends ViewProps {
    hostId: string;
    onRegistered?: (event: {
        nativeEvent: {
            hostId: string;
        };
    }) => void;
    onUnregistered?: (event: {
        nativeEvent: {
            hostId: string;
        };
    }) => void;
}
export declare function NativeModalPortalHost(props: HostProps): import("react").JSX.Element | null;
export interface ContentWrapperProps {
    hostId: string;
    children: React.ReactNode;
}
export declare function NativeModalPortalContentWrapper(props: ContentWrapperProps): import("react").JSX.Element | null;
export interface ContentProps extends ViewProps {
}
export declare function NativeModalPortalContent(props: ContentProps): import("react").JSX.Element | null;
//# sourceMappingURL=native.d.ts.map
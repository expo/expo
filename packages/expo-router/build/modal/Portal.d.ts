import { type PropsWithChildren } from 'react';
import { type ViewProps } from 'react-native';
interface PortalHostConfig {
    hostId: string;
    size: {
        width: number;
        height: number;
    };
    contentSize?: {
        width: number;
        height: number;
    };
    shouldUseContentHeight?: boolean;
    isRegistered?: boolean;
}
interface PortalContextType {
    getHost: (hostId: string) => PortalHostConfig | undefined;
    addHost: (config: PortalHostConfig) => void;
    updateHost: (hostId: string, config: Partial<Omit<PortalHostConfig, 'hostId'>>) => void;
    removeHost: (hostId: string) => void;
}
export declare const PortalContext: import("react").Context<PortalContextType>;
export declare const PortalContextProvider: (props: PropsWithChildren) => import("react").JSX.Element;
export interface ModalPortalHostProps {
    hostId: string;
    useContentHeight?: boolean;
    style?: ViewProps['style'];
    onRegistered?: (event: {
        nativeEvent: {
            hostId: string;
        };
    }) => void;
    onLayout?: (event: {
        nativeEvent: {
            layout: {
                width: number;
                height: number;
            };
        };
    }) => void;
}
export declare const ModalPortalHost: (props: ModalPortalHostProps) => import("react").JSX.Element;
export declare const PortalContentHeightContext: import("react").Context<{
    setHeight: (height: number | undefined) => void;
}>;
export interface ModalPortalContentProps {
    hostId: string;
    children: React.ReactNode;
}
export declare const ModalPortalContent: (props: ModalPortalContentProps) => import("react").JSX.Element | null;
export {};
//# sourceMappingURL=Portal.d.ts.map
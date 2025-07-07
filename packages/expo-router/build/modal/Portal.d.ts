import { type PropsWithChildren } from 'react';
import { type ViewProps } from 'react-native';
interface PortalContextType {
    hasHostId: (hostId: string) => boolean;
    addHostId: (hostId: string) => void;
    removeHostId: (hostId: string) => void;
}
export declare const PortalContext: import("react").Context<PortalContextType>;
export declare const PortalContextProvider: (props: PropsWithChildren) => import("react").JSX.Element;
export interface ModalPortalHostProps {
    hostId: string;
    useContentHeight?: boolean;
    style?: ViewProps['style'];
}
export declare const ModalPortalHost: (props: ModalPortalHostProps) => import("react").JSX.Element;
export interface ModalPortalContentProps {
    hostId: string;
    children: React.ReactNode;
}
export declare const ModalPortalContent: (props: ModalPortalContentProps) => import("react").JSX.Element | null;
export {};
//# sourceMappingURL=Portal.d.ts.map
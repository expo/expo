import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import { type PropsWithChildren } from 'react';
import { type ViewProps } from 'react-native';
export interface ModalConfig {
    component: React.ReactNode;
    parentNavigationProp: NavigationProp<ParamListBase>;
    uniqueId: string;
    animationType?: 'slide' | 'fade' | 'none';
    presentationStyle?: 'fullScreen' | 'overFullScreen' | 'pageSheet' | 'formSheet';
    transparent?: boolean;
    viewProps?: ViewProps;
    detents?: number[] | 'fitToContents';
}
declare const ALLOWED_EVENT_TYPE_LISTENERS: readonly ["didClose", "close", "show"];
type AllowedEventTypeListeners = (typeof ALLOWED_EVENT_TYPE_LISTENERS)[number];
export interface ModalContextType {
    modalConfigs: ModalConfig[];
    openModal: (config: ModalConfig) => void;
    updateModal: (id: string, config: Omit<Partial<ModalConfig>, 'uniqueId'>) => void;
    closeModal: (id: string) => void;
    addEventListener: (type: AllowedEventTypeListeners, callback: (id: string) => void) => () => void;
}
export declare const ModalContextProvider: ({ children }: PropsWithChildren) => import("react").JSX.Element;
export declare const useModalContext: () => ModalContextType;
export {};
//# sourceMappingURL=ModalContext.d.ts.map
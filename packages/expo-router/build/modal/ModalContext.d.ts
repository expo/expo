import { NavigationProp, type ParamListBase } from '@react-navigation/native';
import { type PropsWithChildren } from 'react';
interface ModalConfig {
    component: React.ReactNode;
    navigationProp: NavigationProp<ParamListBase>;
    uniqueId: string;
}
export interface ModalContextType {
    modalConfig: ModalConfig | undefined;
    openModal: (config: ModalConfig) => void;
    closeModal: (isNative?: boolean) => void;
    addEventListener: (type: 'close', callback: () => void) => () => void;
}
export declare const ModalContextProvider: ({ children }: PropsWithChildren) => import("react").JSX.Element;
export declare const useModalContext: () => ModalContextType;
export {};
//# sourceMappingURL=ModalContext.d.ts.map
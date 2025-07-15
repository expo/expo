import { type PropsWithChildren } from 'react';
import { type ModalConfig } from './types';
export { type ModalConfig };
export interface ModalContextType {
    modalConfigs: ModalConfig[];
    openModal: (config: ModalConfig) => void;
    closeModal: (id: string) => void;
    addEventListener: (type: 'close' | 'show', callback: (id: string) => void) => () => void;
}
export declare const ModalContextProvider: ({ children }: PropsWithChildren) => import("react").JSX.Element;
export declare const useModalContext: () => ModalContextType;
//# sourceMappingURL=ModalContext.d.ts.map
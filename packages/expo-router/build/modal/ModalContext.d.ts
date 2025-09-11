import { type PropsWithChildren } from 'react';
import { type ModalConfig } from './types';
export { type ModalConfig };
declare const ALLOWED_EVENT_TYPE_LISTENERS: readonly ["close", "show"];
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
//# sourceMappingURL=ModalContext.d.ts.map
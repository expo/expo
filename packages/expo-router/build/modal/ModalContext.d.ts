import { type PropsWithChildren } from 'react';
import { DetentChangeData, type ModalConfig } from './types';
export { type ModalConfig };
type EventCallbackMap = {
    close: (id: string) => void;
    show: (id: string) => void;
    detentChange: (id: string, data: DetentChangeData) => void;
};
type AllowedEventTypeListeners = keyof EventCallbackMap;
export interface ModalContextType {
    modalConfigs: ModalConfig[];
    openModal: (config: ModalConfig) => void;
    updateModal: (id: string, config: Omit<Partial<ModalConfig>, 'uniqueId'>) => void;
    closeModal: (id: string) => void;
    addEventListener: <T extends AllowedEventTypeListeners>(type: T, callback: EventCallbackMap[T]) => () => void;
}
export declare const ModalContextProvider: ({ children }: PropsWithChildren) => import("react").JSX.Element;
export declare const useModalContext: () => ModalContextType;
//# sourceMappingURL=ModalContext.d.ts.map
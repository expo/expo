import type { NativeModule } from 'expo';
export type MessageEvent = Record<string, any>;
export type Listener<E> = (event: E) => void;
export type ExpoBrownfieldModuleEvents = {
    onMessage: (event: MessageEvent) => void;
};
export declare class ExpoBrownfieldModuleSpec extends NativeModule<ExpoBrownfieldModuleEvents> {
    popToNative(animated: boolean): void;
    setNativeBackEnabled(enabled: boolean): void;
    sendMessage(message: Record<string, any>): void;
}
export type StateChangeEvent = Record<string, any>;
export type ExpoBrownfieldStateModuleEvents = {
    onStateChange: (event: StateChangeEvent) => void;
};
export declare class ExpoBrownfieldStateModuleSpec extends NativeModule<ExpoBrownfieldStateModuleEvents> {
    getSharedState(key: string): any;
    deleteSharedState(key: string): void;
}
//# sourceMappingURL=types.d.ts.map
import type { NativeModule } from 'expo';
export type MessageEvent = Record<string, any>;
export type Listener<E> = (event: E) => void;
export type Events = {
    onMessage: (event: MessageEvent) => void;
};
export declare class ExpoBrownfieldModuleSpec extends NativeModule<Events> {
    popToNative(animated: boolean): void;
    setNativeBackEnabled(enabled: boolean): void;
    sendMessage(message: Record<string, any>): void;
}
//# sourceMappingURL=ExpoBrownfieldModule.types.d.ts.map
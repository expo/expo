import type { EventSubscription } from 'expo-modules-core';
import type { ExpoBrownfieldModuleSpec, Listener, MessageEvent } from './types';
declare class ExpoBrownfieldModule {
    nativeModule: ExpoBrownfieldModuleSpec;
    constructor(nativeModule: ExpoBrownfieldModuleSpec);
    popToNative(animated?: boolean): void;
    sendMessage(message: Record<string, any>): void;
    setNativeBackEnabled(enabled: boolean): void;
    addListener(listener: Listener<MessageEvent>): EventSubscription;
    listenerCount(): number;
    removeAllListeners(): void;
    removeListener(listener: Listener<MessageEvent>): void;
}
export type { MessageEvent };
declare const _default: ExpoBrownfieldModule;
export default _default;
//# sourceMappingURL=index.d.ts.map
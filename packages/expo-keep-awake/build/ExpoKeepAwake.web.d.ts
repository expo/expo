import { type EventSubscription } from 'expo-modules-core';
import { KeepAwakeListener } from './KeepAwake.types';
/** Wraps the webWakeLock API https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API */
declare const _default: {
    isAvailableAsync(): Promise<boolean>;
    activate(tag: string): Promise<void>;
    deactivate(tag: string): Promise<void>;
    addListenerForTag(tag: string, listener: KeepAwakeListener): EventSubscription;
};
export default _default;
//# sourceMappingURL=ExpoKeepAwake.web.d.ts.map
import { Subscription } from 'expo-modules-core';
import { KeepAwakeListener } from './KeepAwake.types';
declare const _default: {
    isAvailableAsync(): Promise<boolean>;
    activate(tag: string): Promise<void>;
    deactivate(tag: string): Promise<void>;
    addListenerForTag(tag: string, listener: KeepAwakeListener): Subscription;
};
/** Wraps the webWakeLock API https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API */
export default _default;
//# sourceMappingURL=ExpoKeepAwake.web.d.ts.map
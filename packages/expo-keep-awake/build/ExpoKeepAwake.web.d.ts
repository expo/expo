import { Subscription } from 'expo-modules-core';
import { KeepAwakeEvent } from './KeepAwake.types';
declare const _default: {
    isAvailableAsync(): Promise<boolean>;
    activate(tag: string): Promise<void>;
    deactivate(tag: string): Promise<void>;
    addListenerForTag(tag: string, listener: (event: KeepAwakeEvent) => void): Subscription;
};
/** Wraps the webWakeLock API https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API */
export default _default;
//# sourceMappingURL=ExpoKeepAwake.web.d.ts.map
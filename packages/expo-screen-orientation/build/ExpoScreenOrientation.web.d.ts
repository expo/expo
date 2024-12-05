import { NativeModule } from 'expo-modules-core';
import { Orientation, OrientationLock, WebOrientationLock, ExpoOrientationEvents } from './ScreenOrientation.types';
declare class ExpoScreenOrientation extends NativeModule<ExpoOrientationEvents> {
    orientation: ScreenOrientation | null;
    emitOrientationEvent(): Promise<void>;
    startObserving(): void;
    stopObserving(): void;
    supportsOrientationLockAsync(orientationLock: OrientationLock): Promise<boolean>;
    getPlatformOrientationLockAsync(): Promise<WebOrientationLock>;
    getOrientationAsync(): Promise<Orientation>;
    lockAsync(orientationLock: OrientationLock): Promise<void>;
    lockPlatformAsync(webOrientationLock: WebOrientationLock): Promise<void>;
    unlockAsync(): Promise<void>;
}
declare const _default: typeof ExpoScreenOrientation;
export default _default;
//# sourceMappingURL=ExpoScreenOrientation.web.d.ts.map
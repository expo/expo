import { Orientation, OrientationLock, WebOrientationLock } from './ScreenOrientation.types';
declare const _default: {
    supportsOrientationLockAsync(orientationLock: OrientationLock): Promise<boolean>;
    getPlatformOrientationLockAsync(): Promise<WebOrientationLock>;
    getOrientationAsync(): Promise<Orientation>;
    lockAsync(orientationLock: OrientationLock): Promise<void>;
    lockPlatformAsync(webOrientationLock: WebOrientationLock): Promise<void>;
    unlockAsync(): Promise<void>;
};
export default _default;
//# sourceMappingURL=ExpoScreenOrientation.web.d.ts.map
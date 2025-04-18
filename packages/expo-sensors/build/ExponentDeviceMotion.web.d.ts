import { getPermissionsAsync, requestPermissionsAsync } from './utils/isSensorEnabledAsync.web';
declare const _default: {
    /**
     * Gravity on the planet this module supports (currently just Earth) represented as m/s^2.
     */
    readonly Gravity: number;
    isAvailableAsync(): Promise<boolean>;
    _handleMotion(motion: DeviceMotionEvent): void;
    getPermissionsAsync: typeof getPermissionsAsync;
    requestPermissionsAsync: typeof requestPermissionsAsync;
    startObserving(): void;
    stopObserving(): void;
};
export default _default;
//# sourceMappingURL=ExponentDeviceMotion.web.d.ts.map
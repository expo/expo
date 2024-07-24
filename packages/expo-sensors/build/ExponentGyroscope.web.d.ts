import { getPermissionsAsync, requestPermissionsAsync } from './utils/isSensorEnabledAsync.web';
declare const _default: {
    isAvailableAsync(): Promise<boolean>;
    _handleMotion({ accelerationIncludingGravity }: {
        accelerationIncludingGravity: any;
    }): void;
    getPermissionsAsync: typeof getPermissionsAsync;
    requestPermissionsAsync: typeof requestPermissionsAsync;
    startObserving(): void;
    stopObserving(): void;
};
export default _default;
//# sourceMappingURL=ExponentGyroscope.web.d.ts.map
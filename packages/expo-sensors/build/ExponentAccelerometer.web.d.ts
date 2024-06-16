import { getPermissionsAsync, requestPermissionsAsync } from './utils/isSensorEnabledAsync.web';
declare const _default: {
    isAvailableAsync(): Promise<boolean>;
    _handleMotion({ alpha, beta, gamma, timeStamp }: {
        alpha: any;
        beta: any;
        gamma: any;
        timeStamp: any;
    }): void;
    getPermissionsAsync: typeof getPermissionsAsync;
    requestPermissionsAsync: typeof requestPermissionsAsync;
    startObserving(): void;
    stopObserving(): void;
};
export default _default;
//# sourceMappingURL=ExponentAccelerometer.web.d.ts.map
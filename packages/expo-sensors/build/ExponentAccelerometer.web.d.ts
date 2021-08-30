import { getPermissionsAsync, requestPermissionsAsync } from './utils/isSensorEnabledAsync.web';
declare const _default: {
    readonly name: string;
    isAvailableAsync(): Promise<boolean>;
    _handleMotion({ alpha, beta, gamma }: {
        alpha: any;
        beta: any;
        gamma: any;
    }): void;
    getPermissionsAsync: typeof getPermissionsAsync;
    requestPermissionsAsync: typeof requestPermissionsAsync;
    startObserving(): void;
    stopObserving(): void;
};
export default _default;

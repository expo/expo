import { BatteryState } from './Battery.types';
declare const _default: {
    readonly name: string;
    readonly isSupported: boolean;
    getBatteryLevelAsync(): Promise<number>;
    getBatteryStateAsync(): Promise<BatteryState>;
    startObserving(): Promise<void>;
    stopObserving(): Promise<void>;
};
export default _default;

export declare type PowerState = {
    batteryLevel?: number;
    batteryState?: string;
    lowPowerMode?: boolean;
};
export declare type batteryLevel = {
    batteryLevel: number;
};
export declare type batteryState = {
    batteryState: string;
};
export declare type lowPowerMode = {
    lowPowerMode: string;
};
export declare type BatteryLevelUpdateCallback = (batteryLevel: batteryLevel) => void;
export declare type BatteryStateUpdateCallback = (batteryState: batteryState) => void;
export declare type PowerModeUpdateCallback = (lowPowerMode: lowPowerMode) => void;
export declare type BatteryListener = {
    remove: () => void;
};

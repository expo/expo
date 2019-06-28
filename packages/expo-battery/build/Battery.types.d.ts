export declare type PowerState = {
    batteryLevel?: number;
    batteryState?: string;
    lowPowerMode?: boolean;
};
export declare type batteryLevel = {
    batteryLevel: number;
};
export declare type BatteryLevelUpdateCallback = (level: batteryLevel) => void;
export declare type BatteryStateUpdateCallback = (batteryState: string) => void;
export declare type isLowPowerMode = {
    isLowPowerMode: boolean;
};
export declare type PowerModeUpdateCallback = (isLowPowerMode: boolean) => void;
export declare type BatteryListener = {
    remove: () => void;
};

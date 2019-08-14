export declare type PowerState = {
    batteryLevel: number;
    batteryState: BatteryState;
    lowPowerMode: boolean;
};
export declare enum BatteryState {
    UNKNOWN = 0,
    UNPLUGGED = 1,
    CHARGING = 2,
    FULL = 3
}
export declare type BatteryLevelEvent = {
    batteryLevel: number;
};
export declare type BatteryStateEvent = {
    batteryState: BatteryState;
};
export declare type PowerModeEvent = {
    lowPowerMode: boolean;
};
export declare type BatteryLevelUpdateListener = (event: BatteryLevelEvent) => void;
export declare type BatteryStateUpdateListener = (event: BatteryStateEvent) => void;
export declare type PowerModeUpdateListener = (event: PowerModeEvent) => void;

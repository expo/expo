import { PowerState, BatteryState, BatteryLevelUpdateCallback, BatteryListener, BatteryStateUpdateCallback, PowerModeUpdateCallback } from './Battery.types';
export { BatteryState };
export declare function getBatteryLevelAsync(): Promise<number>;
export declare function getBatteryStateAsync(): Promise<BatteryState>;
export declare function isLowPowerModeEnableAsync(): Promise<boolean>;
export declare function getPowerStateAsync(): Promise<PowerState>;
export declare function addBatteryLevelListener(callback: BatteryLevelUpdateCallback): BatteryListener;
export declare function addBatteryStateListener(callback: BatteryStateUpdateCallback): BatteryListener;
export declare function addLowPowerModeListener(callback: PowerModeUpdateCallback): BatteryListener;

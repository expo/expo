import { PowerState, BatteryLevelUpdateCallback, BatteryListener, BatteryStateUpdateCallback, PowerModeUpdateCallback } from './Battery.types';
export declare function getBatteryLevelAsync(): Promise<number>;
export declare function getBatteryStateAsync(): Promise<string>;
export declare function getPowerStateAsync(): Promise<PowerState>;
export declare function watchBatteryLevelChange(callback: BatteryLevelUpdateCallback): BatteryListener;
export declare function watchBatteryStateChange(callback: BatteryStateUpdateCallback): BatteryListener;
export declare function watchPowerModeChange(callback: PowerModeUpdateCallback): BatteryListener;

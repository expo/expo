export type PowerState = {
  batteryLevel: number;
  batteryState: BatteryState;
  lowPowerMode: boolean;
};

export enum BatteryState {
  UNKNOWN = 0,
  UNPLUGGED,
  CHARGING,
  FULL,
}

export type BatteryLevelEvent = { batteryLevel: number };
export type BatteryStateEvent = { batteryState: BatteryState };
export type PowerModeEvent = { lowPowerMode: boolean };

export type BatteryLevelUpdateListener = (event: BatteryLevelEvent) => void;
export type BatteryStateUpdateListener = (event: BatteryStateEvent) => void;
export type PowerModeUpdateListener = (event: PowerModeEvent) => void;

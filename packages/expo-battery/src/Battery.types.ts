export type PowerState = {
  batteryLevel?: number;
  batteryState?: BatteryState;
  lowPowerMode?: boolean;
};

export enum BatteryState{
  UNKNOWN = 0,
  UNPLUGGED,
  CHARGING,
  FULL,
}

export type batteryLevel = { batteryLevel: number };
export type batteryState = { batteryState: batteryState };
export type lowPowerMode = { lowPowerMode: boolean };

export type BatteryLevelUpdateCallback = (batteryLevel: batteryLevel) => void;
export type BatteryStateUpdateCallback = (batteryState: batteryState) => void;
export type PowerModeUpdateCallback = (lowPowerMode: lowPowerMode) => void;
export type BatteryListener = { remove: () => void };

export type PowerState = {
  batteryLevel?: number;
  batteryState?: string;
  lowPowerMode?: boolean;
};

export type batteryLevel = { batteryLevel: number };
export type batteryState = { batteryState: string };
export type lowPowerMode = { lowPowerMode: string };

export type BatteryLevelUpdateCallback = (batteryLevel: batteryLevel) => void;
export type BatteryStateUpdateCallback = (batteryState: batteryState) => void;
export type PowerModeUpdateCallback = (lowPowerMode: lowPowerMode) => void;
export type BatteryListener = { remove: () => void };

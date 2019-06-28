export type PowerState = {
  batteryLevel?: number;
  batteryState?: string;
  lowPowerMode?: boolean;
};

export type batteryLevel = { batteryLevel: number };
export type BatteryLevelUpdateCallback = (level: batteryLevel) => void;
export type BatteryStateUpdateCallback = (batteryState: string) => void;
export type isLowPowerMode = { isLowPowerMode: boolean };
export type PowerModeUpdateCallback = (isLowPowerMode: boolean) => void;
export type BatteryListener = { remove: () => void };

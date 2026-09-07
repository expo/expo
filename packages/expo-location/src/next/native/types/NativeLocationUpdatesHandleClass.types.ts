import type { LocationProfile } from '../../types';

export declare class NativeLocationUpdatesHandleClass {
  constructor(taskName: string);
  withProfile(profile: LocationProfile): void;
  withDistanceInterval(meters: number): void;
  start(): Promise<void>;
  stop(): Promise<void>;
  hasStarted(): Promise<boolean>;
}

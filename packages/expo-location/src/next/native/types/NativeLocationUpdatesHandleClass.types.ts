import type { BackgroundTaskStatus, LocationProfile } from '../../types';

export declare class NativeLocationUpdatesHandleClass {
  constructor(taskName: string);
  withProfile(profile: LocationProfile): void;
  start(): Promise<void>;
  stop(): Promise<void>;
  hasStarted(): Promise<boolean>;
  status(): BackgroundTaskStatus;
}

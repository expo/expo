import type { GeofencingRegion } from '../../types';

export declare class NativeGeofencingHandleClass {
  constructor(taskName: string);
  start(regions: GeofencingRegion[]): Promise<void>;
  stop(): Promise<void>;
  hasStarted(): Promise<boolean>;
}

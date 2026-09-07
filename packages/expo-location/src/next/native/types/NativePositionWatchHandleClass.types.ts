import { SharedObject } from 'expo';

import type { LocationProfile, PositionUpdate } from '../../types';

export declare class NativePositionWatchHandleClass extends SharedObject<{
  onPositionUpdate: (update: PositionUpdate) => void;
}> {
  constructor(profile: LocationProfile);
  start(): boolean;
  pause(): void;
  resume(): boolean;
  withProfile(profile: LocationProfile): NativePositionWatchHandleClass;
  withInterval(intervalSeconds: number): NativePositionWatchHandleClass;
  restart(): boolean;
  status(): {}; // TBD
}

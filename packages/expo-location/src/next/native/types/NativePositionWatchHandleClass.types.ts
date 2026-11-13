import { SharedObject } from 'expo';

import type { LocationProfile, PositionUpdate, PositionWatchStatus } from '../../types';

export declare class NativePositionWatchHandleClass extends SharedObject<{
  positionChanged: (update: PositionUpdate) => void;
}> {
  pause(): void;
  resume(): boolean;
  withProfile(profile: LocationProfile): NativePositionWatchHandleClass;
  withInterval(intervalSeconds: number): NativePositionWatchHandleClass;
  restart(): boolean;
  status(): PositionWatchStatus;
}

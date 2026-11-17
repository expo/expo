import { SharedObject } from 'expo';

import type { HeadingUpdate, HeadingWatchStatus } from '../../types';

export declare class NativeHeadingWatchHandleClass extends SharedObject<{
  headingChanged: (update: HeadingUpdate) => void;
}> {
  pause(): void;
  resume(): boolean;
  withFilter(degrees: number): NativeHeadingWatchHandleClass;
  restart(): boolean;
  status(): HeadingWatchStatus;
}

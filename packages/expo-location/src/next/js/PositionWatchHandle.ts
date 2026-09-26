import type { EventSubscription } from 'expo';

import { NativeLocationModuleNext } from '../native';
import type { NativePositionWatchHandleClass } from '../native';
import { LocationProfile } from '../types';
import type { Position, PositionWatchStatus, WatchPositionParams } from '../types';

export class PositionWatchHandle {
  private readonly nativeHandle: NativePositionWatchHandleClass;

  constructor(profile: LocationProfile = LocationProfile.DEFAULT) {
    this.nativeHandle = NativeLocationModuleNext.watchPosition(profile);
  }

  pause(): void {
    this.nativeHandle.pause();
  }

  resume(): boolean {
    return this.nativeHandle.resume();
  }

  withProfile(profile: LocationProfile): this {
    this.nativeHandle.withProfile(profile);
    return this;
  }

  withInterval(intervalSeconds: number): this {
    this.nativeHandle.withInterval(intervalSeconds);
    return this;
  }

  restart(): boolean {
    return this.nativeHandle.restart();
  }

  status(): PositionWatchStatus {
    return this.nativeHandle.status();
  }

  dispose(): void {
    this.nativeHandle.removeAllListeners('positionChanged');
    this.nativeHandle.release();
  }

  addListener(
    onPosition: (position: Position) => void,
    onError?: (error: string) => void
  ): EventSubscription {
    return this.nativeHandle.addListener('positionChanged', ({ data, error }) => {
      if (error != null) {
        onError?.(error);
        return;
      }
      if (data != null) {
        onPosition(data);
      }
    });
  }
}

export function watchPosition({
  profile = LocationProfile.DEFAULT,
  onPosition,
  onError,
}: WatchPositionParams): PositionWatchHandle {
  const handle = new PositionWatchHandle(profile);
  handle.addListener(onPosition, onError);
  return handle;
}

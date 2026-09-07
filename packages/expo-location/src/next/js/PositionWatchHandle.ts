import type { EventSubscription } from 'expo';

import { NativePositionWatchHandle } from '../native';
import type { NativePositionWatchHandleClass } from '../native';
import { LocationProfile } from '../types';
import type { Position, WatchPositionParams } from '../types';

export class PositionWatchHandle {
  private readonly nativeHandle: NativePositionWatchHandleClass;

  constructor(profile: LocationProfile = LocationProfile.DEFAULT) {
    this.nativeHandle = new NativePositionWatchHandle(profile);
  }

  start(): boolean {
    return this.nativeHandle.start();
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

  status(): {} {
    return this.nativeHandle.status();
  }

  dispose(): void {
    this.nativeHandle.removeAllListeners('onPositionUpdate');
    this.nativeHandle.pause();
    this.nativeHandle.release();
  }

  addListener(
    onPosition: (position: Position) => void,
    onError?: (error: string) => void
  ): EventSubscription {
    return this.nativeHandle.addListener('onPositionUpdate', ({ data, error }) => {
      if (error !== null) {
        onError?.(error);
        return;
      }
      onPosition(data);
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
  handle.start();
  return handle;
}

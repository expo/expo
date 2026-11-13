import { Platform, UnavailabilityError } from 'expo';
import type { EventSubscription } from 'expo';

import { NativeLocationModuleNext } from '../native';
import type { NativeHeadingWatchHandleClass } from '../native';
import type { Heading, HeadingWatchError, HeadingWatchStatus, WatchHeadingParams } from '../types';

export class HeadingWatchHandle {
  private readonly nativeHandle: NativeHeadingWatchHandleClass;

  constructor(filter?: number) {
    if (Platform.OS !== 'ios') {
      throw new UnavailabilityError('expo-location', 'watchHeading');
    }
    this.nativeHandle = NativeLocationModuleNext.watchHeading(filter);
  }

  pause(): void {
    this.nativeHandle.pause();
  }

  resume(): boolean {
    return this.nativeHandle.resume();
  }

  withFilter(degrees: number): this {
    this.nativeHandle.withFilter(degrees);
    return this;
  }

  restart(): boolean {
    return this.nativeHandle.restart();
  }

  status(): HeadingWatchStatus {
    return this.nativeHandle.status();
  }

  dispose(): void {
    this.nativeHandle.removeAllListeners('headingChanged');
    this.nativeHandle.release();
  }

  addListener(
    onHeading: (heading: Heading) => void,
    onError?: (error: HeadingWatchError) => void
  ): EventSubscription {
    return this.nativeHandle.addListener('headingChanged', ({ data, error }) => {
      if (error != null) {
        onError?.(error);
        return;
      }
      if (data != null) {
        onHeading(data);
      }
    });
  }
}

export function watchHeading({
  filter,
  onHeading,
  onError,
}: WatchHeadingParams): HeadingWatchHandle {
  const handle = new HeadingWatchHandle(filter);
  handle.addListener(onHeading, onError);
  return handle;
}

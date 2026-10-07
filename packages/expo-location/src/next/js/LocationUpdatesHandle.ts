import type { TaskManagerError } from 'expo-task-manager';

import { getNativeLocationModuleNext } from '../native';
import type { NativeLocationUpdatesHandleClass } from '../native';
import type { LocationProfile, Position } from '../types';

const DEFAULT_LOCATION_TASK_NAME = 'expo-location-background-location';

export class LocationUpdatesHandle {
  private readonly nativeHandle: NativeLocationUpdatesHandleClass;

  constructor(taskName: string = DEFAULT_LOCATION_TASK_NAME) {
    this.nativeHandle = new (getNativeLocationModuleNext().LocationUpdatesHandle)(taskName);
  }

  withProfile(profile: LocationProfile): this {
    this.nativeHandle.withProfile(profile);
    return this;
  }

  start(): Promise<void> {
    return this.nativeHandle.start();
  }

  stop(): Promise<void> {
    return this.nativeHandle.stop();
  }

  hasStarted(): Promise<boolean> {
    return this.nativeHandle.hasStarted();
  }
}

export function defineLocationTask({
  taskName = DEFAULT_LOCATION_TASK_NAME,
  onPosition,
  onError,
}: {
  taskName?: string;
  onPosition: (position: Position) => void;
  onError?: (error: TaskManagerError) => void;
}): void {
  requireTaskManager().defineTask<Position>(taskName, async ({ data, error }) => {
    if (error) {
      onError?.(error);
      return;
    }
    onPosition(data);
  });
}

function requireTaskManager(): typeof import('expo-task-manager') {
  try {
    return require('expo-task-manager');
  } catch {
    throw new Error(
      "defineLocationTask couldn't define the background location task because the 'expo-task-manager' package isn't installed. Background location updates are delivered through it. Install it with `npx expo install expo-task-manager` and rebuild the app."
    );
  }
}

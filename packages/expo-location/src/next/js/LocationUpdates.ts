import * as TaskManager from 'expo-task-manager';
import type { TaskManagerError } from 'expo-task-manager';

import { NativeLocationUpdatesHandle } from '../native';
import type { NativeLocationUpdatesHandleClass } from '../native';
import type { LocationProfile, Position } from '../types';

const DEFAULT_LOCATION_TASK_NAME = 'expo-location-background-location';

export class LocationUpdatesHandle {
  private readonly nativeHandle: NativeLocationUpdatesHandleClass;

  constructor(taskName: string = DEFAULT_LOCATION_TASK_NAME) {
    this.nativeHandle = new NativeLocationUpdatesHandle(taskName);
  }

  withProfile(profile: LocationProfile): this {
    this.nativeHandle.withProfile(profile);
    return this;
  }

  withDistanceInterval(meters: number): this {
    this.nativeHandle.withDistanceInterval(meters);
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
  TaskManager.defineTask<Position>(taskName, async ({ data, error }) => {
    if (error) {
      onError?.(error);
      return;
    }
    onPosition(data);
  });
}

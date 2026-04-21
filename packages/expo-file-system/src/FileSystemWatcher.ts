import type { EventSubscription } from 'expo-modules-core';

import ExpoFileSystem from './ExpoFileSystem';
import {
  DEFAULT_DEBOUNCE_MS,
  type WatchEvent,
  type WatchEventType,
  type WatchOptions,
  type WatchSubscription,
} from './ExpoFileSystem.types';
import type { Directory, File } from './FileSystem';

type TargetFactory<T> = (uri: string, isDirectory: boolean) => T;

interface NativeWatchEvent {
  type: WatchEventType;
  path: string;
  isDirectory: boolean;
  nativeEventFlags?: number;
  newPath?: string;
  newPathIsDirectory?: boolean;
}

function normalizePath(path: string): string {
  return path.replace(/\/+$/, '');
}

export class FileSystemWatcher<T extends File | Directory> implements WatchSubscription {
  private nativeWatcher: InstanceType<typeof ExpoFileSystem.FileSystemWatcher> | null;
  private subscription: EventSubscription | null = null;
  private removed = false;
  private readonly normalizedWatchedPath: string;

  constructor(
    path: string,
    callback: (event: WatchEvent<T>) => void,
    options: WatchOptions = {},
    private readonly targetFactory: TargetFactory<T>
  ) {
    this.normalizedWatchedPath = normalizePath(path);
    this.nativeWatcher = new ExpoFileSystem.FileSystemWatcher(path, {
      debounce: options.debounce ?? DEFAULT_DEBOUNCE_MS,
      events: options.events,
    });

    this.subscription = this.nativeWatcher.addListener('change', (raw: NativeWatchEvent) => {
      const event = this.mapEvent(raw);
      const isWatchedTarget = normalizePath(raw.path) === this.normalizedWatchedPath;

      if (!options.events || options.events.includes(event.type)) {
        callback(event);
      }

      if ((event.type === 'deleted' || event.type === 'renamed') && isWatchedTarget) {
        this.remove();
      }
    });

    try {
      this.nativeWatcher.start();
    } catch (error) {
      this.subscription.remove();
      this.subscription = null;
      this.nativeWatcher = null;
      throw error;
    }
  }

  private mapEvent(raw: NativeWatchEvent): WatchEvent<T> {
    return {
      type: raw.type,
      target: this.targetFactory(raw.path, raw.isDirectory),
      newTarget: raw.newPath
        ? this.targetFactory(raw.newPath, raw.newPathIsDirectory ?? raw.isDirectory)
        : undefined,
      nativeEventFlags: raw.nativeEventFlags,
    };
  }

  remove(): void {
    if (this.removed) {
      return;
    }
    this.removed = true;

    this.subscription?.remove();
    this.subscription = null;

    this.nativeWatcher?.stop();
    this.nativeWatcher = null;
  }
}

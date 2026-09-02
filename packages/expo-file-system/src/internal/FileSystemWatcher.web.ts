import type { Directory } from '../Directory';
import type { File } from '../File';
import type { WatchEvent, WatchOptions, WatchSubscription } from '../FileSystemWatcher.types';

type TargetFactory<T> = (uri: string, isDirectory: boolean) => T;

export class FileSystemWatcher<T extends File | Directory> implements WatchSubscription {
  constructor(
    _path: string,
    _callback: (event: WatchEvent<T>) => void,
    _options: WatchOptions = {},
    _targetFactory: TargetFactory<T>
  ) {
    console.warn('FileSystemWatcher is not supported on web');
  }

  remove(): void {}
}

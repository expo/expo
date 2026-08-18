import { Directory } from './Directory';
import ExpoFileSystem from './ExpoFileSystem';
import type { PathInfo } from './Paths.types';
import { PathUtilities } from './pathUtilities';

export class Paths extends PathUtilities {
  /**
   * A property containing the cache directory – a place to store files that can be deleted by the system when the device runs low on storage.
   */
  static get cache() {
    return new Directory(ExpoFileSystem.cacheDirectory);
  }

  /**
   * A property containing the bundle directory – the directory where assets bundled with the application are stored.
   */
  static get bundle() {
    return new Directory(ExpoFileSystem.bundleDirectory);
  }

  /**
   * A property containing the document directory – a place to store files that are safe from being deleted by the system.
   */
  static get document() {
    return new Directory(ExpoFileSystem.documentDirectory);
  }
  static get appleSharedContainers() {
    const containers: Record<string, string> = ExpoFileSystem.appleSharedContainers ?? {};
    const result: Record<string, Directory> = {};
    for (const appGroupId in containers) {
      if (containers[appGroupId]) {
        result[appGroupId] = new Directory(containers[appGroupId]);
      }
    }
    return result;
  }

  /**
   * A property that represents the total space on device's internal storage, represented in bytes.
   */
  static get totalDiskSpace() {
    return ExpoFileSystem.totalDiskSpace;
  }

  /**
   * A property that represents the available space on device's internal storage, represented in bytes.
   */
  static get availableDiskSpace() {
    return ExpoFileSystem.availableDiskSpace;
  }

  /**
   * Returns an object that indicates if the specified path represents a directory.
   */
  static info(...uris: string[]): PathInfo {
    return ExpoFileSystem.info(uris.join('/'));
  }
}

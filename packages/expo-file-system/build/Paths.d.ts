import { Directory } from './Directory';
import type { PathInfo } from './Paths.types';
import { PathUtilities } from './pathUtilities';
export declare class Paths extends PathUtilities {
    /**
     * A property containing the cache directory – a place to store files that can be deleted by the system when the device runs low on storage.
     */
    static get cache(): Directory;
    /**
     * A property containing the bundle directory – the directory where assets bundled with the application are stored.
     */
    static get bundle(): Directory;
    /**
     * A property containing the document directory – a place to store files that are safe from being deleted by the system.
     */
    static get document(): Directory;
    static get appleSharedContainers(): Record<string, Directory>;
    /**
     * A property that represents the total space on device's internal storage, represented in bytes.
     */
    static get totalDiskSpace(): number;
    /**
     * A property that represents the available space on device's internal storage, represented in bytes.
     */
    static get availableDiskSpace(): number;
    /**
     * Returns an object that indicates if the specified path represents a directory.
     */
    static info(...uris: string[]): PathInfo;
}
//# sourceMappingURL=Paths.d.ts.map
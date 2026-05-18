import type { Directory } from '../Directory';
import type { File } from '../File';
import { type WatchEvent, type WatchOptions, type WatchSubscription } from '../FileSystemWatcher.types';
type TargetFactory<T> = (uri: string, isDirectory: boolean) => T;
/**
 * @hidden
 * Internal implementation of file system watching. Use `File.watch()` or `Directory.watch()` instead.
 */
export declare class FileSystemWatcher<T extends File | Directory> implements WatchSubscription {
    private readonly targetFactory;
    private nativeWatcher;
    private subscription;
    private removed;
    private readonly normalizedWatchedPath;
    constructor(path: string, callback: (event: WatchEvent<T>) => void, options: WatchOptions | undefined, targetFactory: TargetFactory<T>);
    private mapEvent;
    remove(): void;
}
export {};
//# sourceMappingURL=FileSystemWatcher.d.ts.map
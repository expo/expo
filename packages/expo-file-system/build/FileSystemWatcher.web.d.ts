import type { WatchEvent, WatchOptions, WatchSubscription } from './ExpoFileSystem.types';
import type { Directory, File } from './FileSystem';
type TargetFactory<T> = (uri: string, isDirectory: boolean) => T;
export declare class FileSystemWatcher<T extends File | Directory> implements WatchSubscription {
    constructor(_path: string, _callback: (event: WatchEvent<T>) => void, _options: WatchOptions | undefined, _targetFactory: TargetFactory<T>);
    remove(): void;
}
export {};
//# sourceMappingURL=FileSystemWatcher.web.d.ts.map
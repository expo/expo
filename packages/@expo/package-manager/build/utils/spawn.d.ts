import { SpawnPromise } from '@expo/spawn-async';
/**
 * The pending spawn promise is similar to the spawn promise from `@expo/spawn-async`.
 * Instead of the `child` process being available immediately, the `child` is behind another promise.
 * We need this to perform async tasks before running the actual spawn promise.
 * Use it like: `await manager.installAsync().child`
 */
export interface PendingSpawnPromise<T> extends Promise<T> {
    /**
     * The child process from the delayed spawn.
     * This is `null` whenever the promise before the spawn promise is rejected.
     */
    child: Promise<SpawnPromise<T>['child'] | null>;
}
export declare function createPendingSpawnAsync<V, T>(actionAsync: () => Promise<V>, spawnAsync: (result: V) => SpawnPromise<T>): PendingSpawnPromise<T>;

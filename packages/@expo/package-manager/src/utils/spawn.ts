import spawnAsync, { SpawnOptions, SpawnPromise } from '@expo/spawn-async';
import sudo from 'sudo-prompt';

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

export function createPendingSpawnAsync<V, T>(
  actionAsync: () => Promise<V>,
  spawnAsync: (result: V) => SpawnPromise<T>
): PendingSpawnPromise<T> {
  // Manually rsolve the child promise whenever the prepending async action is resolved.
  // Avoid `childReject` to prevent "unhandled promise rejection" for one of the two promises.
  let childResolve: (child: SpawnPromise<T>['child'] | null) => void;
  const child: Promise<SpawnPromise<T>['child'] | null> = new Promise((resolve, reject) => {
    childResolve = resolve;
  });

  const pendingPromise = new Promise<T>((spawnResolve, spawnReject) => {
    actionAsync()
      .then((result) => {
        const spawnPromise = spawnAsync(result);
        childResolve(spawnPromise.child);
        spawnPromise.then(spawnResolve).catch(spawnReject);
      })
      .catch((error) => {
        childResolve(null);
        spawnReject(error);
      });
  });

  (pendingPromise as PendingSpawnPromise<T>).child = child;
  return pendingPromise as PendingSpawnPromise<T>;
}

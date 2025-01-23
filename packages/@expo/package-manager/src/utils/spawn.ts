import spawnAsync, { SpawnOptions, SpawnPromise } from '@expo/spawn-async';
import sudo from '@expo/sudo-prompt';

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

/**
 * Spawn a command with sudo privileges.
 * On windows, this uses the `sudo-prompt` package.
 * on other systems, this uses the `sudo` binary.
 */
export async function spawnSudoAsync(command: string[], spawnOptions: SpawnOptions): Promise<void> {
  // sudo prompt only seems to work on win32 machines.
  if (process.platform === 'win32') {
    return new Promise((resolve, reject) => {
      sudo.exec(command.join(' '), { name: 'pod install' }, (error) => {
        if (error) {
          reject(error);
        }
        resolve();
      });
    });
  } else {
    // Attempt to use sudo to run the command on Mac and Linux.
    // TODO(Bacon): Make a v of sudo-prompt that's win32 only for better bundle size.
    console.log(
      'Your password might be needed to install CocoaPods CLI: https://guides.cocoapods.org/using/getting-started.html#installation'
    );
    await spawnAsync('sudo', command, spawnOptions);
  }
}

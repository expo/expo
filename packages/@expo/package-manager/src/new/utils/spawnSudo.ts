import spawnAsync, { SpawnOptions } from '@expo/spawn-async';
import sudo from 'sudo-prompt';

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

import spawnAsync, { SpawnOptions } from '@expo/spawn-async';
import { realpathSync } from 'fs';
import sudo from 'sudo-prompt';

export type Logger = (...args: any[]) => void;

export interface PackageManager {
  installAsync(): Promise<void>;
  addWithParametersAsync(names: string[], parameters: string[]): Promise<void>;
  addAsync(...names: string[]): Promise<void>;
  addDevAsync(...names: string[]): Promise<void>;
  versionAsync(): Promise<string>;
  getConfigAsync(key: string): Promise<string>;
  removeLockfileAsync(): Promise<void>;
  cleanAsync(): Promise<void>;
}

export function getPossibleProjectRoot(): string {
  return realpathSync(process.cwd());
}

export async function spawnSudoAsync(command: string[], spawnOptions: SpawnOptions): Promise<void> {
  // sudo prompt only seems to work on win32 machines.
  if (process.platform === 'win32') {
    return new Promise((resolve, reject) => {
      sudo.exec(command.join(' '), { name: 'pod install' }, error => {
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

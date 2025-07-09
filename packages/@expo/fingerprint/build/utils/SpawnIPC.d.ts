import { type SpawnOptions, type SpawnPromise, type SpawnResult } from '@expo/spawn-async';
interface SpawnWithIpcResult extends SpawnResult {
    message: string;
}
export declare function spawnWithIpcAsync(command: string, args?: string[], options?: SpawnOptions): SpawnPromise<SpawnWithIpcResult>;
export {};

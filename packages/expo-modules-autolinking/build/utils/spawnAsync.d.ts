/// <reference types="node" />
import { SpawnOptions } from 'child_process';
/**
 * Lightweight version of @expo/spawn-async. Returns a promise that is fulfilled with the output of
 * stdout, or rejected with the error event object (or the output of stderr).
 */
export default function spawnAsync(command: string, args?: readonly string[], options?: SpawnOptions): Promise<string>;

import spawnAsync from '@expo/spawn-async';
import { spawn } from 'child_process';
import { Transform, TransformCallback, TransformOptions } from 'stream';

/**
 * Starts an arbitrary iOS simulator so that simctl can reference a "booted" simulator.
 */
export async function startSimulatorAsync(): Promise<void> {
  try {
    await spawnAsync('xcrun', ['instruments', '-w', 'iPhone X (11.2) [']);
  } catch (e) {
    // Instruments exits with an expected error
    if (!e.stderr.includes('Instruments Usage Error')) {
      throw e;
    }
  }
}

export async function installSimulatorAppAsync(
  simulatorId: string,
  archivePath: string
): Promise<void> {
  try {
    await spawnAsync('xcrun', ['simctl', 'install', simulatorId, archivePath]);
  } catch (e) {
    const error = new Error(e.stderr);
    (error as any).status = e.status;
    throw error;
  }
}

export async function launchSimulatorAppAsync(
  simulatorId: string,
  bundleIdentifier: string
): Promise<void> {
  try {
    await spawnAsync('xcrun', ['simctl', 'launch', simulatorId, bundleIdentifier]);
  } catch (e) {
    const error = new Error(e.stderr);
    (error as any).status = e.status;
    throw error;
  }
}

export function getSimulatorLogProcess(simulatorId: string, predicate?: string) {
  return spawn(
    'xcrun',
    [
      'simctl',
      'spawn',
      simulatorId,
      'log',
      'stream',
      '--style',
      'json',
      ...(predicate ? ['--predicate', predicate] : []),
    ],
    {
      stdio: ['ignore', 'pipe', 'inherit'],
    }
  );
}

export class IOSLogStream extends Transform {
  constructor(options?: TransformOptions) {
    super({ ...options, objectMode: true });
  }

  _transform(data: Buffer, encoding: string, callback: TransformCallback): void {
    // In practice, we receive each log entry as a separate chunk and can test if they are valid,
    // JSON-formatted log entries
    let entry;
    try {
      entry = JSON.parse(data.toString('utf8'));
    } catch {}

    if (entry?.eventMessage) {
      this.push(entry);
    }
    callback();
  }
}

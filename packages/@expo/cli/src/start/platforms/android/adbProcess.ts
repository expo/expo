import spawnAsync from '@expo/spawn-async';

import { event } from '../events';

type AdbProcessPhase = 'host-request' | 'device-service';
type AdbClientTermination = 'terminated' | 'killed' | 'exit-unobserved';

export class AdbProcessError extends Error {
  constructor(
    message: string,
    readonly operation: string,
    readonly phase: AdbProcessPhase,
    remoteCompletionUnknown?: true,
    spawnFailed?: true
  ) {
    super(message);
    this.remoteCompletionUnknown = remoteCompletionUnknown;
    this.spawnFailed = spawnFailed;
  }

  remoteCompletionUnknown?: boolean;
  spawnFailed?: boolean;
  stdout?: string;
  stderr?: string;
  status?: number;
  signal?: AbortSignal;
}

export class AdbProcessWaitError extends AdbProcessError {}

const ADB_SUBPROCESS_CLEANUP_WAIT_LIMIT_MS = 2_000;

export const runAdbHostQueryAsync = (
  command: string,
  args: string[],
  operation: string,
  signal?: AbortSignal
): Promise<spawnAsync.SpawnResult> =>
  runAdbProcessAsync(
    command,
    args,
    { operation, phase: 'host-request', hasSideEffects: false },
    signal
  );

export const runBoundedAdbHostQueryAsync = (
  command: string,
  args: string[],
  operation: string,
  waitLimitMs: number,
  signal?: AbortSignal
): Promise<spawnAsync.SpawnResult> =>
  runAdbProcessAsync(
    command,
    args,
    { operation, phase: 'host-request', hasSideEffects: false, waitLimitMs },
    signal
  );

export const runAdbDeviceQueryAsync = (
  command: string,
  args: string[],
  operation: string,
  signal?: AbortSignal
): Promise<spawnAsync.SpawnResult> =>
  runAdbProcessAsync(
    command,
    args,
    { operation, phase: 'device-service', hasSideEffects: false },
    signal
  );

export const runBoundedAdbDeviceQueryAsync = (
  command: string,
  args: string[],
  operation: string,
  waitLimitMs: number,
  signal?: AbortSignal
): Promise<spawnAsync.SpawnResult> =>
  runAdbProcessAsync(
    command,
    args,
    { operation, phase: 'device-service', hasSideEffects: false, waitLimitMs },
    signal
  );

export const runAdbDeviceMutationAsync = (
  command: string,
  args: string[],
  operation: string,
  signal?: AbortSignal
): Promise<spawnAsync.SpawnResult> =>
  runAdbProcessAsync(
    command,
    args,
    { operation, phase: 'device-service', hasSideEffects: true },
    signal
  );

interface AdbProcessParams {
  operation: string;
  phase: AdbProcessPhase;
  hasSideEffects: boolean;
  waitLimitMs?: number;
}

async function runAdbProcessAsync(
  command: string,
  args: string[],
  params: AdbProcessParams,
  signal?: AbortSignal
): Promise<spawnAsync.SpawnResult> {
  event('adb_operation_start', {
    operation: params.operation,
    phase: params.phase,
    waitLimitMs: params.waitLimitMs,
  });
  let spawnPromise: spawnAsync.SpawnPromise<spawnAsync.SpawnResult>;
  try {
    // NOTE(@kitten): Passing signal to spawnAsync would bypass cleanup accounting.
    spawnPromise = spawnAsync(command, args);
  } catch (error) {
    throw createProcessError(error, params.operation, params.phase);
  }

  let operationSignal = signal;
  let waitLimitSignal: AbortSignal | undefined;
  if (params.waitLimitMs != null) {
    waitLimitSignal = AbortSignal.timeout(params.waitLimitMs);
    operationSignal = operationSignal
      ? AbortSignal.any([operationSignal, waitLimitSignal])
      : waitLimitSignal;
  }

  try {
    return operationSignal
      ? await raceWithSignal(spawnPromise, operationSignal)
      : await spawnPromise;
  } catch (error) {
    if (operationSignal?.aborted && error === operationSignal.reason) {
      // NOTE(@kitten): Killing this client cannot retract a request already sent to the server
      const clientTermination = await terminateAndObserveAsync(
        spawnPromise,
        ADB_SUBPROCESS_CLEANUP_WAIT_LIMIT_MS
      );
      const waitExpired = waitLimitSignal?.aborted && error === waitLimitSignal.reason;
      event('adb_operation_cleanup', {
        operation: params.operation,
        phase: params.phase,
        reason: waitExpired ? 'wait-limit' : 'cancelled',
        status: clientTermination,
      });

      if (waitExpired) {
        throw new AdbProcessWaitError(
          `Expo stopped waiting for the ADB ${params.operation} operation to finish.`,
          params.operation,
          params.phase,
          params.hasSideEffects ? true : undefined
        );
      }

      if (params.hasSideEffects && error instanceof Error) {
        (error as AdbProcessError).remoteCompletionUnknown = true;
      }

      throw error;
    }
    throw createProcessError(error, params.operation, params.phase);
  }
}

async function terminateAndObserveAsync(
  spawnPromise: spawnAsync.SpawnPromise<spawnAsync.SpawnResult>,
  cleanupWaitLimitMs: number
): Promise<AdbClientTermination> {
  const observed = spawnPromise.then(
    () => undefined,
    () => undefined
  );
  // Cleanup needs a fresh timeout because the operation signal has already aborted
  const cleanupSignal = AbortSignal.timeout(cleanupWaitLimitMs);

  // Windows kill() is forced termination, not a graceful SIGTERM attempt.
  if (process.platform === 'win32') {
    spawnPromise.child.kill();
    return observeProcessExitAsync(observed, cleanupSignal, 'killed');
  }

  const gracefulSignal = AbortSignal.any([
    cleanupSignal,
    AbortSignal.timeout(Math.floor(Math.min(500, Math.max(1, cleanupWaitLimitMs / 4)))),
  ]);

  spawnPromise.child.kill('SIGTERM');
  const gracefulResult = await observeProcessExitAsync(observed, gracefulSignal, 'terminated');
  if (gracefulResult === 'terminated') {
    return gracefulResult;
  } else {
    spawnPromise.child.kill('SIGKILL');
    return observeProcessExitAsync(observed, cleanupSignal, 'killed');
  }
}

async function observeProcessExitAsync(
  processResultPromise: Promise<unknown>,
  signal: AbortSignal,
  observedCleanup: 'terminated' | 'killed'
): Promise<AdbClientTermination> {
  try {
    await raceWithSignal(processResultPromise, signal);
    return observedCleanup;
  } catch {
    return 'exit-unobserved';
  }
}

function raceWithSignal<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) {
    return Promise.reject(signal.reason);
  }
  return new Promise<T>((resolve, reject) => {
    const handleAbort = () => reject(signal.reason);
    signal.addEventListener('abort', handleAbort, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener('abort', handleAbort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener('abort', handleAbort);
        reject(error);
      }
    );
  });
}

function createProcessError(
  error: any,
  operation: string,
  phase: AdbProcessPhase
): AdbProcessError {
  const result = new AdbProcessError(
    error?.message ?? 'Failed to run ADB.',
    operation,
    phase,
    undefined,
    error?.status == null && error?.signal == null ? true : undefined
  );
  result.stdout = error?.stdout;
  result.stderr = error?.stderr;
  result.status = error?.status;
  result.signal = error?.signal;
  return result;
}

export function isAdbTimeoutReason(reason: unknown): boolean {
  return (
    typeof reason === 'object' &&
    reason != null &&
    'name' in reason &&
    reason.name === 'TimeoutError'
  );
}

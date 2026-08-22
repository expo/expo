import { CommandError } from '../../../utils/errors';
import {
  ADB_HOST_PROBE_WAIT_LIMIT_MS,
  formatAdbEndpoint,
  probeAdbHostVersionAsync,
  resolveAdbEndpoint,
} from './adbEndpoint';
import type { AdbEndpoint, AdbHostProbeResult } from './adbEndpoint';
import { AdbProcessError, AdbProcessWaitError } from './adbProcess';

export type AdbDeviceDiagnostic = { pid?: string; state?: string };

function formatAdbError(
  error: unknown,
  endpoint?: AdbEndpoint,
  hostProbe?: AdbHostProbeResult,
  device?: AdbDeviceDiagnostic
): string {
  const details: string[] = [error instanceof Error ? error.message : String(error)];

  // NOTE(@kitten): Side-effect marker from `hasSideEffects` in ./adbProcess.ts
  if (
    typeof error === 'object' &&
    error != null &&
    'remoteCompletionUnknown' in error &&
    error.remoteCompletionUnknown === true
  ) {
    details.push('The operation may have completed on the device. Check before trying again.');
  }

  if (hostProbe && !(error instanceof AdbProcessError && error.spawnFailed)) {
    details.push(formatHostProbeAdvice(error, endpoint, hostProbe));
  }

  details.push(...getAdvice(error, device));
  return details.join('\n');
}

export function formatAdbDeviceError(error: unknown, device: AdbDeviceDiagnostic): string {
  return formatAdbError(error, undefined, undefined, device);
}

export function formatAdbDiscoveryError(
  error: unknown,
  endpoint: AdbEndpoint,
  hostProbe: AdbHostProbeResult
): string {
  return formatAdbError(error, endpoint, hostProbe);
}

export async function createAdbOperationErrorAsync(
  code: string,
  error: unknown,
  device?: AdbDeviceDiagnostic
): Promise<CommandError> {
  const endpoint = resolveAdbEndpoint();
  let hostProbe: AdbHostProbeResult | undefined;
  if (error instanceof AdbProcessWaitError && error.phase === 'device-service') {
    try {
      hostProbe = await probeAdbHostVersionAsync(
        endpoint,
        AbortSignal.timeout(ADB_HOST_PROBE_WAIT_LIMIT_MS)
      );
    } catch {
      hostProbe = {
        kind: 'connection-failure',
      };
    }
  }
  return new CommandError(code, formatAdbError(error, endpoint, hostProbe, device));
}

function formatHostProbeAdvice(
  error: unknown,
  endpoint: AdbEndpoint | undefined,
  result: AdbHostProbeResult
): string {
  const formattedEndpoint = endpoint ? formatAdbEndpoint(endpoint) : 'the configured endpoint';
  switch (result.kind) {
    case 'version':
      return `The ADB server is responding, but ${error instanceof AdbProcessError ? error.operation : 'the command'} did not finish. Check the device connection and try again.`;
    case 'connected-no-reply':
      return `The ADB server at ${formattedEndpoint} is not responding. Check or restart that server, then try again.`;
    case 'connection-refused':
    case 'connection-failure':
      return `Could not connect to the ADB server at ${formattedEndpoint}. Check the server configuration and try again.`;
    case 'adb-failure':
      return `The ADB server rejected Expo's health check: ${result.message}. Check the server configuration and try again.`;
    case 'invalid-protocol':
      return `The configured endpoint at ${formattedEndpoint} is not an ADB server. Check ADB_SERVER_SOCKET and try again.`;
    case 'unsupported':
      return 'Expo could not check the configured ADB server. Check ADB_SERVER_SOCKET and try again.';
  }
}

function getAdvice(error: unknown, device?: AdbDeviceDiagnostic): string[] {
  const advice: string[] = [];
  if (error instanceof AdbProcessError && error.spawnFailed) {
    advice.push('Check that Android SDK Platform-Tools is installed and ADB is available.');
  }
  if (device?.state === 'offline') {
    advice.push(`Reconnect ${device.pid ? `device ${device.pid}` : 'the device'} and try again.`);
  } else if (device?.state === 'unauthorized') {
    advice.push('Authorize this computer on the device, then try again.');
  } else if (device?.state && device.state !== 'device') {
    advice.push('Wait until ADB reports the device as ready, then try again.');
  }
  if ((!device?.state || device.state === 'device') && isAdbDeviceDisconnectedError(error)) {
    advice.push('The device disconnected. Reconnect it and try again.');
  }
  return advice;
}

export function isAdbDeviceDisconnectedError(error: unknown): boolean {
  return (
    error instanceof Error &&
    /device (?:not found|offline|still authorizing)|no devices\/emulators found|transport (?:is closed|error)/i.test(
      error.message
    )
  );
}

import net from 'node:net';
import { setTimeout as delayAsync } from 'node:timers/promises';

import { event } from '../events';
import { isAdbTimeoutReason } from './adbProcess';

export const ADB_HOST_PROBE_WAIT_LIMIT_MS = 4_000;

type AdbEndpointSource =
  | 'ADB_SERVER_SOCKET'
  | 'ANDROID_ADB_SERVER_ADDRESS'
  | 'ANDROID_ADB_SERVER_PORT'
  | 'default';

export type AdbEndpoint =
  | {
      type: 'tcp';
      host: string;
      port: number;
      scope: 'local' | 'remote';
      source: AdbEndpointSource;
    }
  | {
      type: 'local-filesystem';
      path: string;
      source: 'ADB_SERVER_SOCKET';
    }
  | {
      type: 'unsupported';
      specification: string;
      source: 'ADB_SERVER_SOCKET';
    };

export type AdbHostProbeResult =
  | { kind: 'connection-refused' }
  | { kind: 'connection-failure' }
  | { kind: 'connected-no-reply' }
  | { kind: 'adb-failure'; message: string }
  | { kind: 'invalid-protocol' }
  | { kind: 'version' }
  | { kind: 'unsupported' };

type AdbHostVersionFrame =
  | Extract<AdbHostProbeResult, { kind: 'adb-failure' | 'invalid-protocol' | 'version' }>
  | { kind: 'incomplete' };

const DEFAULT_ADB_HOST = '127.0.0.1';
const DEFAULT_ADB_PORT = 5037;
const ADB_STARTUP_GRACE_MS = 250;

export function formatAdbEndpoint(endpoint: AdbEndpoint): string {
  switch (endpoint.type) {
    case 'tcp': {
      const host = net.isIP(endpoint.host) === 6 ? `[${endpoint.host}]` : endpoint.host;
      return `tcp:${host}:${endpoint.port} (${endpoint.scope}, selected by ${endpoint.source})`;
    }
    case 'local-filesystem':
      return `localfilesystem:${endpoint.path} (selected by ${endpoint.source})`;
    case 'unsupported':
      return `${endpoint.specification} (selected by ${endpoint.source}, direct probe unsupported)`;
  }
}

export function resolveAdbEndpoint(
  environment: Readonly<Record<string, string | undefined>> = process.env
): AdbEndpoint {
  const socket = environment.ADB_SERVER_SOCKET;
  if (socket) {
    return parseServerSocket(socket);
  }

  const address = environment.ANDROID_ADB_SERVER_ADDRESS;
  const port = parsePort(environment.ANDROID_ADB_SERVER_PORT) ?? DEFAULT_ADB_PORT;
  const host = address || DEFAULT_ADB_HOST;
  const source: AdbEndpointSource = address
    ? 'ANDROID_ADB_SERVER_ADDRESS'
    : environment.ANDROID_ADB_SERVER_PORT
      ? 'ANDROID_ADB_SERVER_PORT'
      : 'default';
  return tcpEndpoint(host, port, source);
}

function encodeAdbHostRequest(service: string): Buffer {
  const payload = Buffer.from(service, 'utf8');
  return Buffer.concat([Buffer.from(payload.length.toString(16).padStart(4, '0')), payload]);
}

export function parseAdbHostVersionResponse(response: Buffer): AdbHostVersionFrame {
  if (response.length < 4) {
    return { kind: 'incomplete' };
  }

  const status = response.subarray(0, 4).toString('ascii');
  if (status !== 'OKAY' && status !== 'FAIL') {
    return {
      kind: 'invalid-protocol',
    };
  } else if (response.length < 8) {
    return { kind: 'incomplete' };
  }

  const lengthText = response.subarray(4, 8).toString('ascii');
  if (!/^[0-9a-fA-F]{4}$/.test(lengthText)) {
    return {
      kind: 'invalid-protocol',
    };
  }

  const length = Number.parseInt(lengthText, 16);
  if (response.length < 8 + length) {
    return { kind: 'incomplete' };
  }

  const payload = response.subarray(8, 8 + length).toString('utf8');
  if (status === 'FAIL') {
    return { kind: 'adb-failure', message: payload };
  } else if (!/^[0-9a-fA-F]+$/.test(payload)) {
    return {
      kind: 'invalid-protocol',
    };
  } else {
    return { kind: 'version' };
  }
}

export async function probeAdbHostVersionAsync(
  endpoint: AdbEndpoint,
  signal: AbortSignal
): Promise<AdbHostProbeResult> {
  function recordHostProbeResult(endpoint: AdbEndpoint, result: AdbHostProbeResult): void {
    event('adb_host_probe', {
      endpoint: formatAdbEndpoint(endpoint),
      result: result.kind,
    });
  }

  event('adb_operation_start', {
    operation: 'host version probe',
    phase: 'host-request',
    waitLimitMs: ADB_HOST_PROBE_WAIT_LIMIT_MS,
  });

  if (endpoint.type === 'unsupported') {
    const result = { kind: 'unsupported' } as const;
    recordHostProbeResult(endpoint, result);
    return result;
  }

  let result = await probeEndpointOnceAsync(endpoint, signal);
  // A new local server may briefly refuse connections while starting.
  if (
    result.kind === 'connection-refused' &&
    (endpoint.type === 'local-filesystem' || endpoint.scope === 'local') &&
    !signal.aborted
  ) {
    await delayAsync(ADB_STARTUP_GRACE_MS, undefined, { signal });
    result = await probeEndpointOnceAsync(endpoint, signal);
  }

  recordHostProbeResult(endpoint, result);
  return result;
}

async function probeEndpointOnceAsync(
  endpoint: Exclude<AdbEndpoint, { type: 'unsupported' }>,
  signal: AbortSignal
): Promise<AdbHostProbeResult> {
  signal.throwIfAborted();
  const socket =
    endpoint.type === 'tcp'
      ? net.createConnection({ host: endpoint.host, port: endpoint.port })
      : net.createConnection(endpoint.path);
  let connectionState: 'connecting' | 'connected' = 'connecting';
  let response = Buffer.alloc(0);
  let handleConnect = () => {};
  let handleData = (_chunk: Buffer) => {};
  let handleError = (_error: NodeJS.ErrnoException) => {};
  let handleClose = () => {};
  let handleAbort = () => {};

  try {
    return await new Promise<AdbHostProbeResult>((resolve, reject) => {
      handleConnect = () => {
        connectionState = 'connected';
        socket.write(encodeAdbHostRequest('host:version'));
      };
      handleData = (chunk: Buffer) => {
        response = Buffer.concat([response, chunk]);
        const frame = parseAdbHostVersionResponse(response);
        if (frame.kind !== 'incomplete') {
          resolve(frame);
        }
      };
      handleError = (error: NodeJS.ErrnoException) => {
        resolve(
          error.code === 'ECONNREFUSED'
            ? { kind: 'connection-refused' }
            : { kind: 'connection-failure' }
        );
      };
      handleClose = () => {
        resolve(
          connectionState === 'connected'
            ? { kind: 'connected-no-reply' }
            : { kind: 'connection-failure' }
        );
      };
      handleAbort = () => {
        if (isAdbTimeoutReason(signal.reason) && connectionState === 'connected') {
          resolve({ kind: 'connected-no-reply' });
        } else {
          reject(signal.reason);
        }
      };

      socket.once('connect', handleConnect);
      socket.on('data', handleData);
      socket.once('error', handleError);
      socket.once('close', handleClose);
      signal.addEventListener('abort', handleAbort, { once: true });
    });
  } finally {
    signal.removeEventListener('abort', handleAbort);
    socket.removeListener('connect', handleConnect);
    socket.removeListener('data', handleData);
    socket.removeListener('error', handleError);
    socket.removeListener('close', handleClose);
    socket.destroy();
  }
}

function parseServerSocket(specification: string): AdbEndpoint {
  if (specification.startsWith('localfilesystem:')) {
    const path = specification.slice('localfilesystem:'.length);
    return path
      ? { type: 'local-filesystem', path, source: 'ADB_SERVER_SOCKET' }
      : { type: 'unsupported', specification, source: 'ADB_SERVER_SOCKET' };
  }
  if (specification.startsWith('tcp:')) {
    const address = specification.slice('tcp:'.length);
    const lastColon = address.lastIndexOf(':');
    if (lastColon < 0) {
      const port = parsePort(address);
      if (port != null) {
        return tcpEndpoint(DEFAULT_ADB_HOST, port, 'ADB_SERVER_SOCKET');
      }
    } else {
      const host = stripIpv6Brackets(address.slice(0, lastColon));
      const port = parsePort(address.slice(lastColon + 1));
      if (host && port != null) {
        return tcpEndpoint(host, port, 'ADB_SERVER_SOCKET');
      }
    }
  }
  return { type: 'unsupported', specification, source: 'ADB_SERVER_SOCKET' };
}

function tcpEndpoint(host: string, port: number, source: AdbEndpointSource): AdbEndpoint {
  return {
    type: 'tcp',
    host,
    port,
    scope: isLocalhost(host) ? 'local' : 'remote',
    source,
  };
}

function isLocalhost(host: string): boolean {
  return ['localhost', '127.0.0.1', '::1'].includes(stripIpv6Brackets(host).toLowerCase());
}

function stripIpv6Brackets(host: string): string {
  return host.startsWith('[') && host.endsWith(']') ? host.slice(1, -1) : host;
}

function parsePort(value: string | undefined): number | null {
  if (!value || !/^\d+$/.test(value)) {
    return null;
  }
  const port = Number(value);
  return port > 0 && port <= 65535 ? port : null;
}

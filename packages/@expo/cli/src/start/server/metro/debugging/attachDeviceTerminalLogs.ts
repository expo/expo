import Protocol from 'devtools-protocol';
import chalk from 'chalk';
import type { RawData, WebSocket, WebSocketServer } from 'ws';

import { evaluateThroughCdpSocket } from '../../middleware/inspector/evaluateThroughCdp';
import { terminal } from '../instantiateMetro';
import { CdpMessage, DeviceRequest, WrappedEvent } from './types';

/**
 * Listen for new CDP device connections and enable terminal logging through the CDP protocol.
 * This will always "flush" the logs to terminal once the device connects.
 * Both the React Native DevTools and this listener can be connected simultaneously.
 */
export function attachDeviceTerminalLogs(devices: WebSocketServer) {
  devices.on('connection', (socket) => {
    console.log('DEVICE CONNECTED');
    socket.once('message', (raw, isBinary) => {
      // if (isBinary) return;
      // const data = raw.toString();
      // if (!data.includes('getPages')) return;

      // const pages = .map((p: any) => p.id);
      // console.log('DEVICE LOGS ATTACHED');
      // JSON.parse(data).payload.forEach((page: any) => {
      createDeviceLoggerAsync(socket, '69');
      // })
    });
  });
}

async function createDeviceLoggerAsync(socket: WebSocket, pageId: string) {
  // const platform = await resolveDevicePlatform(socket, pageId);
  const platform = chalk.bold('device');

  // console.log('DEVICE DETECTED: ', platform);

  const onSocketMessage = (raw: RawData, isBinary: boolean) => {
    // Ignore binary communication
    if (isBinary) return;

    try {
      const data = raw.toString();
      if (!data.includes('Runtime.consoleAPICalled')) return;

      const parsed: WrappedEvent = JSON.parse(data);
      const event: DeviceRequest<RuntimeConsoleAPICalled> = JSON.parse(parsed.payload.wrappedEvent);

      if (event.method === 'Runtime.consoleAPICalled') {
        terminal.log(platform, event.params.type, ...convertArgs(event.params.args));
      }
    } catch {
      // ignore errors
      // TODO: add debug logging
    }
  };

  socket.on('message', onSocketMessage);
  // socket.once('error', () => socket.off('message', onSocketMessage));
  // socket.once('close', () => socket.off('message', onSocketMessage));
}

async function resolveDevicePlatform(socket: WebSocket, pageId: string, retries = 0) {
  try {
    const platform = await evaluateThroughCdpSocket(
      socket,
      `globalThis.expo.modules.ExpoDevice.osName.toLowerCase()`,
      pageId,
      60_000
    );

    switch (platform) {
      case 'ios':
        return chalk.blue('iOS');
      case 'android':
        return chalk.green('Android');
      default:
        return chalk.bold('device');
    }
  } catch (error) {
    if (retries < 10) {
      console.log('retrying...', { retries });
      return resolveDevicePlatform(socket, pageId, retries + 1);
    }

    throw error;
  }
}

function convertArgs(args: Protocol.Runtime.ConsoleAPICalledEvent['args']): any[] {
  console.log('MAPPING', args);
  return args.map((item) => convertArg(item));
}

function convertArg(arg: Protocol.Runtime.ConsoleAPICalledEvent['args'][number]) {
  if (arg.type === 'object' && arg.preview) {
    if (arg.preview.subtype === 'array') {
      return arg.preview.properties.map((arg: any): any => convertArg(arg));
    }

    if (arg.preview.type === 'object') {
      return Object.fromEntries(
        arg.preview.properties.map((property: any): any => {
          return [property.name, convertArg(property)];
        })
      );
    }

    return arg.preview.description;
  }

  if (arg.type === 'number') {
    return Number(arg.value);
  }

  if (arg.type === 'boolean') {
    return Boolean(arg.value);
  }

  return arg.value;
}

type RuntimeConsoleAPICalled = CdpMessage<
  'Runtime.consoleAPICalled',
  Protocol.Runtime.ConsoleAPICalledEvent
>;

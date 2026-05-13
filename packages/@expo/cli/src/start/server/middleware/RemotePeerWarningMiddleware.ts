import chalk from 'chalk';
import type { Socket } from 'node:net';

import type { ServerNext, ServerRequest, ServerResponse } from './server.types';
import { Log } from '../../../log';
import { isLocalSocket } from '../../../utils/net';

export interface RemotePeerWarning {
  /** Connect-style HTTP middleware. Logs the first request from a non-loopback peer. */
  middleware: (req: ServerRequest, res: ServerResponse, next: ServerNext) => void;
  /** Call this from a WebSocket upgrade handler. Shares dedup state with `middleware`. */
  onRemotePeer: (socket: Socket | undefined, userAgent: string | undefined) => void;
}

const IPV4_MAPPED_PREFIX = '::ffff:';

/**
 * Builds a one-shot, per-IP, per-server-session warning that fires when a non-loopback
 * peer (e.g. a real device on the LAN) reaches the Metro dev server.
 *
 * HTTP and WebSocket entry points share the same `seen` set so a peer that opens both
 * `/hot` and a bundle request only logs once.
 */
export function createRemotePeerWarning(): RemotePeerWarning {
  const seen = new Set<string>();

  const handlePeer = (socket: Socket | undefined, userAgent: string | undefined) => {
    if (process.env.EXPO_SILENCE_REMOTE_PEER_WARNINGS) return;
    if (!socket || isLocalSocket(socket)) return;

    const remoteAddress = socket.remoteAddress;
    if (!remoteAddress) return;

    const ip = normalizeIp(remoteAddress);
    if (seen.has(ip)) return;
    seen.add(ip);

    const label = recognizeUserAgent(userAgent);
    const who = label ? `${chalk.bold(ip)} (${label})` : chalk.bold(ip);
    Log.warn(
      `A device at ${who} just connected to your dev server.\n` +
        `  To restrict access to local simulators/emulators/USB devices, ` +
        `restart with: ${chalk.bold('expo start --localhost')}\n` +
        `  Silence: ${chalk.dim('EXPO_SILENCE_REMOTE_PEER_WARNINGS=1')}`
    );
  };

  return {
    middleware: (req, _res, next) => {
      handlePeer(req.socket, asString(req.headers['user-agent']));
      next();
    },
    onRemotePeer: handlePeer,
  };
}

function normalizeIp(remoteAddress: string): string {
  return remoteAddress.startsWith(IPV4_MAPPED_PREFIX)
    ? remoteAddress.slice(IPV4_MAPPED_PREFIX.length)
    : remoteAddress;
}

function asString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

/** Returns a friendly label for known user agents, or null if unrecognized. */
function recognizeUserAgent(userAgent: string | undefined): string | null {
  if (!userAgent) return null;
  if (/Expo Go/i.test(userAgent)) return 'Expo Go';
  if (/Expo\//i.test(userAgent)) return 'Expo dev client';
  if (/okhttp/i.test(userAgent)) return 'Android';
  if (/CFNetwork|Darwin/i.test(userAgent)) return 'iOS';
  if (/Chrome|Firefox|Edg(e|iOS|A)|Safari/i.test(userAgent)) return 'browser';
  const toolMatch = /^(curl|wget|HTTPie|httpie)\b/i.exec(userAgent);
  if (toolMatch?.[1]) return toolMatch[1].toLowerCase();
  return null;
}

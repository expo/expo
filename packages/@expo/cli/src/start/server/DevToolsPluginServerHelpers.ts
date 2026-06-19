import fs from 'node:fs';
import type { IncomingMessage } from 'node:http';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { type WebSocket, WebSocketServer } from 'ws';

import * as Log from '../../log';
import { isPathInside } from '../../utils/dir';

const importEsm = require('@expo/cli/add-module') as <T>(moduleName: string) => Promise<T>; 

const maybeRealpath = (target: string): string => {
  try {
    return fs.realpathSync(target);
  } catch {
    return target;
  }
};

/**
 * Determines whether a server entry point should be loaded as an ES module. `.mjs` is always ESM
 * and `.cjs` is always CommonJS; for `.js` we read the nearest `package.json` between the entry
 * point directory and plugin package root, treating `"type": "module"` as ESM and everything else
 * as CommonJS.
 */
export const isEsmEntryPoint = (entryPoint: string, packageRoot: string): boolean => {
  const ext = path.extname(entryPoint).toLowerCase();
  if (ext === '.mjs') {
    return true;
  }
  if (ext === '.cjs') {
    return false;
  }
  return nearestPackageType(entryPoint, packageRoot) === 'module';
};

/**
 * Reads the `type` field of the nearest `package.json` between the entry point's directory and the
 * plugin package root. Defaults to CommonJS when no package manifest in that range can be read.
 */
const nearestPackageType = (entryPoint: string, packageRoot: string): 'module' | 'commonjs' => {
  const root = maybeRealpath(packageRoot);
  const cwd = path.dirname(entryPoint);

  for (let dir = cwd; dir === root || isPathInside(dir, root); dir = path.dirname(dir)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
      return pkg.type === 'module' ? 'module' : 'commonjs';
    } catch {
      // Keep walking toward packageRoot until a readable package.json is found.
    }

    if (path.dirname(dir) === dir) {
      break;
    }
  }

  Log.warn(
    `Unable to load package.json for DevTools plugin server entry point ${entryPoint}, loading as CommonJS.`
  );
  return 'commonjs';
};

export const loadServerModuleAsync = async (
  entryPoint: string,
  packageRoot: string
): Promise<any> => {
  const realPath = maybeRealpath(entryPoint);
  if (isEsmEntryPoint(realPath, packageRoot)) {
    return await importEsm(pathToFileURL(realPath).href);
  }
  return require(realPath);
};

/**
 * Handler default-exported by a plugin's `serverEntryPoint`. Receives a fetch API `Request`
 * with the plugin endpoint prefix stripped from the URL. Returning `null`/`undefined` falls
 * through to static `webpageRoot` serving.
 */
export type DevToolsPluginRequestHandler = (
  request: Request
) => Response | null | undefined | Promise<Response | null | undefined>;

/**
 * Per-connection WebSocket handler exported by a plugin's `serverEntryPoint`. Receives the
 * connected `ws` socket, the upgrade `request`, and the `WebSocketServer` the connection belongs
 * to (use `server.clients` to broadcast). Mirrors the `ws` `'connection'` event so plugin authors
 * use the familiar `socket.on('message', ...)` / `socket.send(...)` API.
 */
export type DevToolsPluginWebSocketHandler = (
  socket: WebSocket,
  request: IncomingMessage,
  server: WebSocketServer
) => void;

export async function loadRequestHandlerAsync({
  packageName,
  packageRoot,
  serverEntryPoint,
}: {
  packageName: string;
  packageRoot: string;
  serverEntryPoint: string;
}): Promise<DevToolsPluginRequestHandler> {
  const serverModule = await loadServerModuleAsync(serverEntryPoint, packageRoot);
  const handler = typeof serverModule === 'function' ? serverModule : serverModule?.default;
  if (typeof handler !== 'function') {
    throw new Error(
      `The serverEntryPoint (${serverEntryPoint}) of plugin ${packageName} ` +
        `must default-export a handler function that takes a Request and returns a Response. ` +
        `Export it as \`export default function handler(request) {}\` ` +
        `or \`exports.default = function handler(request) {}\`.`
    );
  }
  return handler;
}

export async function loadWebSocketServerAsync({
  packageName,
  packageRoot,
  serverEntryPoint,
}: {
  packageName: string;
  packageRoot: string;
  serverEntryPoint: string;
}): Promise<Record<string, WebSocketServer>> {
  const serverModule = await loadServerModuleAsync(serverEntryPoint, packageRoot);
  const handlers: Record<string, DevToolsPluginWebSocketHandler> =
    serverModule?.webSocketHandlers ?? {};

  return Object.fromEntries(
    Object.entries(handlers).map(([route, handler]) => {
      if (typeof handler !== 'function') {
        throw new Error(
          `The webSocketHandlers["${route}"] export of plugin ${packageName} ` +
            `must be a function (socket, request, server) => void.`
        );
      }
      const server = new WebSocketServer({ noServer: true });
      server.on('connection', (socket, request) => handler(socket, request, server));
      // Routes are mounted relative to the plugin endpoint, so they must be absolute.
      return [route.startsWith('/') ? route : `/${route}`, server];
    })
  );
}

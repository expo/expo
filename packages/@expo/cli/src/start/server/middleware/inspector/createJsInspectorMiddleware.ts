import chalk from 'chalk';
import type { NextHandleFunction } from 'connect';
import type { IncomingMessage, ServerResponse } from 'http';
import net from 'net';
import { TLSSocket } from 'tls';
import { URL } from 'url';

import { openJsInspector, queryInspectorAppAsync } from './JsInspector';

/**
 * Create a middleware that handles new requests to open the debugger from the dev menu.
 * @todo(cedric): delete this middleware once we fully swap over to the new React Native JS Inspector.
 */
export function createJsInspectorMiddleware(): NextHandleFunction {
  return async function (req: IncomingMessage, res: ServerResponse, next: (err?: Error) => void) {
    const { origin, searchParams } = new URL(req.url ?? '/', getServerBase(req));
    const appId = searchParams.get('appId') || searchParams.get('applicationId');
    if (!appId) {
      res.writeHead(400).end('Missing application identifier ("?appId=...")');
      return;
    }

    const app = await queryInspectorAppAsync(origin, appId);
    if (!app) {
      res.writeHead(404).end('Unable to find inspector target from @react-native/dev-middleware');
      console.warn(
        chalk.yellow(
          'No compatible apps connected. JavaScript Debugging can only be used with the Hermes engine.'
        )
      );
      return;
    }

    if (req.method === 'GET') {
      const data = JSON.stringify(app);
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=UTF-8',
        'Cache-Control': 'no-cache',
        'Content-Length': data.length.toString(),
      });
      res.end(data);
    } else if (req.method === 'POST' || req.method === 'PUT') {
      try {
        await openJsInspector(origin, app);
      } catch (error: any) {
        // abort(Error: Command failed: osascript -e POSIX path of (path to application "google chrome")
        // 15:50: execution error: Google Chrome got an error: Application isn’t running. (-600)

        console.error(
          chalk.red('Error launching JS inspector: ' + (error?.message ?? 'Unknown error occurred'))
        );
        res.writeHead(500);
        res.end();
        return;
      }
      res.end();
    } else {
      res.writeHead(405);
    }
  };
}

function getServerBase(req: IncomingMessage): string {
  const scheme =
    req.socket instanceof TLSSocket && req.socket.encrypted === true ? 'https' : 'http';
  const { localAddress, localPort } = req.socket;
  const address = localAddress && net.isIPv6(localAddress) ? `[${localAddress}]` : localAddress;
  return `${scheme}:${address}:${localPort}`;
}

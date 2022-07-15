import type { NextHandleFunction } from 'connect';
import type { IncomingMessage, ServerResponse } from 'http';
import net from 'net';
import { TLSSocket } from 'tls';
import { URL } from 'url';

import { openJsInspector, queryInspectorAppAsync } from '../JsInspector';

export default function createJsInspectorMiddleware(): NextHandleFunction {
  return async function (req: IncomingMessage, res: ServerResponse, next: (err?: Error) => void) {
    const { origin, searchParams } = new URL(req.url ?? '/', getServerBase(req));
    const applicationId = searchParams.get('applicationId');
    if (!applicationId) {
      res.writeHead(400).end('Missing applicationId');
      return;
    }

    const app = await queryInspectorAppAsync(origin, applicationId);
    if (!app) {
      res.writeHead(404).end('Unable to find inspector target from metro-inspector-proxy');
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
      openJsInspector(app);
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
  const address = net.isIPv6(localAddress) ? `[${localAddress}]` : localAddress;
  return `${scheme}:${address}:${localPort}`;
}

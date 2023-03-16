import { writeReadableStreamToWritable } from '@remix-run/node';
import * as http from 'http';

import { ExpoRequest, ExpoResponse } from '../environment';

// Convert an http request to an expo request
export function convertRequest(req: http.IncomingMessage, res: http.ServerResponse): ExpoRequest {
  const url = new URL(req.url!, `http://${req.headers.host}`);

  // const url = new URL(`${req.protocol}://${req.get('host')}${req.url}`);

  // Abort action/loaders once we can no longer write a response
  const controller = new AbortController();
  res.on('close', () => controller.abort());

  const init: RequestInit = {
    method: req.method,
    headers: convertHeaders(req.headers),
    // Cast until reason/throwIfAborted added
    // https://github.com/mysticatea/abort-controller/issues/36
    signal: controller.signal as RequestInit['signal'],
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = req;
  }

  return new ExpoRequest(url.href, init);
}

export function convertHeaders(requestHeaders: http.IncomingHttpHeaders): Headers {
  const headers = new Headers();

  for (const [key, values] of Object.entries(requestHeaders)) {
    if (values) {
      if (Array.isArray(values)) {
        for (const value of values) {
          headers.append(key, value);
        }
      } else {
        headers.set(key, values);
      }
    }
  }

  return headers;
}

export async function respond(res: http.ServerResponse, expoRes: ExpoResponse): Promise<void> {
  res.statusMessage = expoRes.statusText;
  res.statusCode = expoRes.status;

  for (let [key, values] of Object.entries(expoRes.headers.raw())) {
    for (let value of values) {
      res.setHeader(key, value);
    }
  }

  if (expoRes.body) {
    await writeReadableStreamToWritable(expoRes.body, res);
  } else {
    res.end();
  }
}

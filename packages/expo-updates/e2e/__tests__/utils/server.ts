import express from 'express';
import path from 'path';
import { setTimeout } from 'timers/promises';

const app: any = express();
let server: any;

let notifyString: string | null = null;
let updateRequest: any = null;
let manifestToServe: any = null;
let manifestHeadersToServe: any = null;

export function start(port: number) {
  if (!server) {
    server = app.listen(port);
  }
}

export function stop() {
  if (server) {
    server.close();
    server = null;
  }
  notifyString = null;
  updateRequest = null;
  manifestToServe = null;
  manifestHeadersToServe = null;
}

app.use('/static', express.static(path.resolve(__dirname, '..', '.static')));

app.get('/notify/:string', (req: any, res: any) => {
  notifyString = req.params.string;
  res.set('Cache-Control', 'no-store');
  res.send('Received request');
});

export async function waitForResponse(timeout: number) {
  const finishTime = new Date().getTime() + timeout;
  while (!notifyString) {
    const currentTime = new Date().getTime();
    if (currentTime >= finishTime) {
      throw new Error('Timed out waiting for response');
    }
    await setTimeout(50);
  }

  const response = notifyString;
  notifyString = null;
  return response;
}

app.get('/update', (req: any, res: any) => {
  updateRequest = req;
  if (manifestToServe) {
    if (manifestHeadersToServe) {
      Object.keys(manifestHeadersToServe).forEach((headerName) => {
        res.set(headerName, manifestHeadersToServe[headerName]);
      });
    }
    res.json(manifestToServe);
  } else {
    res.send('No update available');
  }
});

export function serveManifest(manifest: any, headers?: any) {
  manifestToServe = manifest;
  manifestHeadersToServe = headers ?? null;
}

export async function waitForUpdateRequest(timeout: number) {
  const finishTime = new Date().getTime() + timeout;
  while (!updateRequest) {
    const currentTime = new Date().getTime();
    if (currentTime >= finishTime) {
      throw new Error('Timed out waiting for update request');
    }
    await setTimeout(50);
  }

  const request = updateRequest;
  updateRequest = null;
  return request;
}

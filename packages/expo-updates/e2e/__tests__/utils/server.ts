import express from 'express';
import { setTimeout } from 'timers/promises';

const app: any = express();
let server: any;

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
}

let notifyString: string | null = null;
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

let updateRequest: any = null;
app.get('/update', (req: any, res: any) => {
  updateRequest = req;
  res.send('No update available');
});

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

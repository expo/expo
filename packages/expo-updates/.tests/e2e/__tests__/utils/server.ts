import express from 'express';

const app: any = express();
let server: any;

let notifyString: string | null = null;
app.get('/notify/:string', (req: any, res: any) => {
  notifyString = req.params.string;
  res.set('Cache-Control', 'no-store');
  res.send('Received request');
})

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
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForResponse(timeout: number) {
  let delayLength = 0;
  while (!notifyString) {
    delayLength += 50;
    if (delayLength > timeout) {
      throw new Error('Timed out waiting for response')
    }
    await delay(50);
  }
  
  const response = notifyString;
  notifyString = null;
  return response;
}
